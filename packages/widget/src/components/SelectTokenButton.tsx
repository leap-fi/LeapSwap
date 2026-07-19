import { styled } from '@mui/material/styles'
import { Card } from './Card/Card.js'
import { ReactNode } from 'react'

const StyledCard = styled(Card)`
  // ... existing styles ...
`

interface SelectTokenButtonProps {
  children: ReactNode
  [key: string]: any
}

export const SelectTokenButton = ({ children, ...props }: SelectTokenButtonProps) => {
  return (
    <StyledCard as="div" {...props}>
      {children}
    </StyledCard>
  )
} 