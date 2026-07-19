import type { Route } from '@leapswap/widget-sdk'

export interface RouteCardProps {
  route: Route
  variant?: 'default' | 'cardless'
  active?: boolean
  expanded?: boolean
}

export interface RouteCardEssentialsProps {
  route: Route
}

export interface RouteCardSkeletonProps {
  variant?: 'default' | 'cardless'
}
