import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

export const StyledIcon = styled.span`
  display: inline-block;
  position: relative;
  /* NOTE: following is to get svg icons displaying correctly in IE */
  height: 100%;
  width: 100%;
  svg {
    width: 100%;
    height: 100%;
    ${props => (props.hasStroke ? 'stroke: currentColor;' : '')} ${props =>
      props.hasFill ? 'fill: currentColor;' : ''};
  }
`
StyledIcon.displayName = 'StyledIcon'

const Icon = ({ stroke, fill, children }) => (
  <StyledIcon className="icon" hasStroke={stroke} hasFill={fill}>
    {children}
  </StyledIcon>
)

Icon.propTypes = {
  stroke: PropTypes.bool,
  fill: PropTypes.bool,
  children: PropTypes.node.isRequired,
}
Icon.defaultProps = {
  stroke: false,
  fill: false,
}

export default Icon
