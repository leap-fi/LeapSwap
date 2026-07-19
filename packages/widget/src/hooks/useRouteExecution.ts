import {
  useAccount,
  useAccountDisconnect,
  useWalletMenu,
} from '@leapswap/wallet-management'
import type {
  ExchangeRateUpdateParams,
  Route,
} from '@leapswap/widget-sdk'
import { updateRouteExecution } from '@leapswap/widget-sdk'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { useConfig, useWalletClient } from 'wagmi'
// @ts-ignore - runtime implementation is provided by the host app (widget package)
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { shallow } from 'zustand/shallow'
import { executeRoute } from '../services/ExecuteRoute.js'
import {
  useRouteExecutionStore,
  useRouteExecutionStoreContext,
} from '../stores/routes/RouteExecutionStore.js'
import {
  getUpdatedProcess,
  isRouteActive,
  isRouteDone,
  isRouteFailed,
} from '../stores/routes/utils.js'
import { WidgetEvent } from '../types/events.js'
import { useAvailableChains } from './useAvailableChains.js'
import { useWidgetEvents } from './useWidgetEvents.js'
interface RouteExecutionProps {
  routeId: string
  executeInBackground?: boolean
  onAcceptExchangeRateUpdate?(
    resolver: (value: boolean) => void,
    data: ExchangeRateUpdateParams
  ): void
}

export const useRouteExecution = ({
  routeId,
  executeInBackground,
  onAcceptExchangeRateUpdate,
}: RouteExecutionProps) => {
  const queryClient = useQueryClient()

  const wagmiConfig = useConfig()
  const disconnect = useAccountDisconnect()
  const { openWalletMenu } = useWalletMenu()
  const solanaWallet = useWalletClient()
  const nearWallet = useWalletSelector() as any
  // const { wallet: solanaWallet } = useWallet()
  const resumedAfterMount = useRef(false)
  const emitter = useWidgetEvents()
  const routeExecutionStoreContext = useRouteExecutionStoreContext()
  const routeExecution = useRouteExecutionStore(
    (state) => state.routes[routeId]
  )
  const { getChainById } = useAvailableChains()

  const chain: any = getChainById(routeExecution?.route.fromChainId)
  const { account } = useAccount({ chainType: chain.chainType })
  const [updateRoute, restartRoute, deleteRoute] = useRouteExecutionStore(
    (state) => [state.updateRoute, state.restartRoute, state.deleteRoute],
    shallow
  )

  const updateRouteHook = (updatedRoute: Route) => {
    const routeExecution =
      routeExecutionStoreContext.getState().routes[updatedRoute.id]
    if (!routeExecution) {
      return
    }
    const safeObj = JSON.parse(JSON.stringify(updatedRoute))
    const clonedUpdatedRoute = structuredClone(safeObj)
    updateRoute(clonedUpdatedRoute)
    const process = getUpdatedProcess(routeExecution.route, clonedUpdatedRoute)
    if (process) {
      emitter.emit(WidgetEvent.RouteExecutionUpdated, {
        route: clonedUpdatedRoute,
        process,
      })
    }
    const executionCompleted = isRouteDone(clonedUpdatedRoute)
    const executionFailed = isRouteFailed(clonedUpdatedRoute)
    if (executionCompleted) {
      emitter.emit(WidgetEvent.RouteExecutionCompleted, clonedUpdatedRoute)
    }
    if (executionFailed && process) {
      emitter.emit(WidgetEvent.RouteExecutionFailed, {
        route: clonedUpdatedRoute,
        process,
      })
    }
    if (executionCompleted || executionFailed) {
      const invalidateKeys = [
        [
          'token-balances',
          clonedUpdatedRoute.fromAddress,
          clonedUpdatedRoute.fromChainId,
        ],
        [
          'token-balances',
          clonedUpdatedRoute.toAddress,
          clonedUpdatedRoute.toChainId,
        ],
        ['transaction-history'],
      ]
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries(
          {
            queryKey: key,
            exact: false,
            refetchType: 'all',
          },
          { cancelRefetch: false }
        )
      }
    }
    // biome-ignore lint/suspicious/noConsole: logs route information
    console.log('Route updated.', clonedUpdatedRoute)
  }

  const acceptExchangeRateUpdateHook = async (
    params: ExchangeRateUpdateParams
  ) => {
    if (!onAcceptExchangeRateUpdate) {
      return false
    }

    const accepted = await new Promise<boolean>((resolve) =>
      onAcceptExchangeRateUpdate(resolve, params)
    )

    return accepted
  }

  const executeRouteMutation = useMutation({
    mutationFn: () => {
      if (!account.isConnected) {
        throw new Error('Account is not connected.')
      }
      if (!routeExecution?.route) {
        throw new Error('Execution route not found.')
      }
      queryClient.removeQueries({ queryKey: ['routes'], exact: false })
      return executeRoute(routeExecution.route, {
        updateRouteHook,
        acceptExchangeRateUpdateHook,
        infiniteApproval: false,
        executeInBackground,
        account,
        wagmiConfig,
        onDisconnect: disconnect,
        onOpenWalletMenu: openWalletMenu,
        solanaWallet: solanaWallet,
        nearWallet,
      })
    },
    onMutate: () => {
      // biome-ignore lint/suspicious/noConsole: logs route information
      console.log('Execution started.', routeId)
      if (routeExecution) {
        emitter.emit(WidgetEvent.RouteExecutionStarted, routeExecution.route)
      }
    },
  })

  const resumeRouteMutation = useMutation({
    mutationFn: (resumedRoute?: Route) => {
      if (!account.isConnected) {
        throw new Error('Account is not connected.')
      }
      if (!routeExecution?.route) {
        throw new Error('Execution route not found.')
      }
      /*
      return resumeRoute(resumedRoute ?? routeExecution.route, {
        updateRouteHook,
        acceptExchangeRateUpdateHook,
        infiniteApproval: false,
        executeInBackground,
      })
      */
      return executeRoute(resumedRoute ?? routeExecution.route, {
        updateRouteHook,
        acceptExchangeRateUpdateHook,
        infiniteApproval: false,
        executeInBackground,
        account,
        wagmiConfig,
        onDisconnect: disconnect,
        onOpenWalletMenu: openWalletMenu,
        nearWallet,
      })
    },
    onMutate: () => {
      // biome-ignore lint/suspicious/noConsole: logs route information
      console.log('Resumed to execution.', routeId)
    },
  })

  const _executeRoute = useCallback(() => {
    executeRouteMutation.mutateAsync(undefined, {
      onError: (error) => {
        console.warn('Execution failed!', routeId, error)
      },
      onSuccess: (route: Route) => {
        // biome-ignore lint/suspicious/noConsole: logs route information
        console.log('Executed successfully!', route)
      },
    })
  }, [executeRouteMutation, routeId])

  const _resumeRoute = useCallback(
    (route?: Route) => {
      resumeRouteMutation.mutateAsync(route, {
        onError: (error) => {
          console.warn('Resumed execution failed.', routeId, error)
        },
        onSuccess: (route) => {
          // biome-ignore lint/suspicious/noConsole: logs route information
          console.log('Resumed execution successful.', route)
        },
      })
    },
    [resumeRouteMutation, routeId]
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  const restartRouteMutation = useCallback(() => {
    restartRoute(routeId)
    _resumeRoute(routeExecution?.route)
  }, [_resumeRoute, routeExecution?.route, routeId])

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  const deleteRouteMutation = useCallback(() => {
    deleteRoute(routeId)
  }, [routeId])

  // Resume route execution after page reload
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    // Check if route is eligible for automatic resuming
    const route = routeExecutionStoreContext.getState().routes[routeId]?.route
    if (
      isRouteActive(route) &&
      account.isConnected &&
      !resumedAfterMount.current
    ) {
      resumedAfterMount.current = true
      _resumeRoute()
    }

    // Move execution to background on unmount
    return () => {
      const route = routeExecutionStoreContext.getState().routes[routeId]?.route
      if (!route || !isRouteActive(route)) {
        return
      }
      updateRouteExecution(route, { executeInBackground: true })
      // biome-ignore lint/suspicious/noConsole: logs route information
      console.log('Move route execution to background.', routeId)
      resumedAfterMount.current = false
    }
  }, [account.isConnected, routeExecutionStoreContext, routeId])

  return {
    executeRoute: _executeRoute,
    restartRoute: restartRouteMutation,
    deleteRoute: deleteRouteMutation,
    route: routeExecution?.route,
    status: routeExecution?.status,
  }
}
