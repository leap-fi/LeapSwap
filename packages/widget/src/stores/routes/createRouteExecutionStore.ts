import type { Route, RouteExtended } from '@leapswap/widget-sdk'
import type { StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import { createWithEqualityFn } from 'zustand/traditional'
import { hasEnumFlag } from '../../utils/enum.js'
import type { PersistStoreProps } from '../types.js'
import type { RouteExecutionState } from './types.js'
import { RouteExecutionStatus } from './types.js'
import {
  isRouteDone,
  isRouteFailed,
  isRoutePartiallyDone,
  isRouteRefunded,
} from './utils.js'

const replaceBigInts = (obj: any, visited = new WeakSet()): any => {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'bigint') {
    return obj.toString()
  }

  // 检查循环引用
  if (typeof obj === 'object' && visited.has(obj)) {
    return '[Circular Reference]'
  }

  if (Array.isArray(obj)) {
    visited.add(obj)
    const result = obj.map((item) => replaceBigInts(item, visited))
    visited.delete(obj)
    return result
  }

  if (typeof obj === 'object') {
    visited.add(obj)
    const result = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        replaceBigInts(value, visited),
      ])
    )
    visited.delete(obj)
    return result
  }

  return obj
}

export const createRouteExecutionStore = ({ namePrefix }: PersistStoreProps) =>
  createWithEqualityFn<RouteExecutionState>(
    persist(
      (set, get) => ({
        routes: {},
        setExecutableRoute: (route: Route, observableRouteIds?: string[]) => {
          if (!get().routes[route.id]) {
            set((state: RouteExecutionState) => {
              const routes = { ...state.routes }
              // clean previous idle and done routes
              Object.keys(routes)
                .filter(
                  (routeId) =>
                    (!observableRouteIds?.includes(routeId) &&
                      hasEnumFlag(
                        routes[routeId]!.status,
                        RouteExecutionStatus.Idle
                      )) ||
                    hasEnumFlag(
                      routes[routeId]!.status,
                      RouteExecutionStatus.Done
                    )
                )
                .forEach((routeId) => delete routes[routeId])
              // Process BigInt before storing route
              const processedRoute = replaceBigInts(route)
              routes[route.id] = {
                route: processedRoute,
                status: RouteExecutionStatus.Idle,
              }
              return {
                routes,
              }
            })
          }
        },
        updateRoute: (route: RouteExtended) => {
          if (get().routes[route.id]) {
            const processedRoute = replaceBigInts(route)

            set((state: RouteExecutionState) => {
              const updatedState = {
                routes: {
                  ...state.routes,
                  [route.id]: {
                    ...state.routes[route.id]!,
                    route: processedRoute,
                  },
                },
              }
              const isFailed = isRouteFailed(route)
              if (isFailed) {
                updatedState.routes[route.id]!.status =
                  RouteExecutionStatus.Failed
                return updatedState
              }
              const isDone = isRouteDone(route)
              if (isDone) {
                updatedState.routes[route.id]!.status =
                  RouteExecutionStatus.Done
                if (isRoutePartiallyDone(route)) {
                  updatedState.routes[route.id]!.status |=
                    RouteExecutionStatus.Partial
                } else if (isRouteRefunded(route)) {
                  updatedState.routes[route.id]!.status |=
                    RouteExecutionStatus.Refunded
                }
                return updatedState
              }
              const isLoading = route.steps.some((step) => step.execution)
              if (isLoading) {
                updatedState.routes[route.id]!.status =
                  RouteExecutionStatus.Pending
              }
              return updatedState
            })
          }
        },
        restartRoute: (routeId: string) => {
          if (get().routes[routeId]) {
            set((state: RouteExecutionState) => ({
              routes: {
                ...state.routes,
                [routeId]: {
                  ...state.routes[routeId]!,
                  status: RouteExecutionStatus.Pending,
                },
              },
            }))
          }
        },
        deleteRoute: (routeId: string) => {
          if (get().routes[routeId]) {
            set((state: RouteExecutionState) => {
              const routes = { ...state.routes }
              delete routes[routeId]
              return {
                routes,
              }
            })
          }
        },
        deleteRoutes: (type) =>
          set((state: RouteExecutionState) => {
            const routes = { ...state.routes }
            Object.keys(routes)
              .filter((routeId) =>
                type === 'completed'
                  ? hasEnumFlag(
                      routes[routeId]?.status ?? 0,
                      RouteExecutionStatus.Done
                    )
                  : !hasEnumFlag(
                      routes[routeId]?.status ?? 0,
                      RouteExecutionStatus.Done
                    )
              )
              .forEach((routeId) => delete routes[routeId])
            return {
              routes,
            }
          }),
      }),
      {
        name: `${namePrefix || 'leapswap'}-widget-routes`,
        version: 2,
        partialize: (state) => ({ routes: state.routes }),
        merge: (persistedState: any, currentState: RouteExecutionState) => {
          const state = {
            ...currentState,
            ...persistedState,
          } as RouteExecutionState
          try {
            // Remove failed transactions from history after 1 day
            const currentTime = new Date().getTime()
            const oneDay = 1000 * 60 * 60 * 24
            Object.values(state.routes).forEach((routeExecution) => {
              const startedAt =
                routeExecution?.route.steps
                  ?.find((step) => step.execution?.status === 'FAILED')
                  ?.execution?.process.find((process) => process.startedAt)
                  ?.startedAt ?? 0
              const outdated = startedAt > 0 && currentTime - startedAt > oneDay
              if (routeExecution?.route && outdated) {
                delete state.routes[routeExecution.route.id]
              }
            })
          } catch (error) {
            console.error(error)
          }
          return state
        },
      }
    ) as unknown as StateCreator<
      RouteExecutionState,
      [],
      [],
      RouteExecutionState
    >,
    Object.is
  )
