import PropTypes from 'prop-types'
import styled from 'styled-components'

import CloseIcon from '~/ui/icons/CloseIcon'
import v from '~/utils/variables'

/** @component */
export const TopRightButton = styled.button`
  position: ${props => props.position};
  top: ${props => (props.size === 'sm' ? '8px' : '12px')};
  right: ${props => (props.size === 'sm' ? '12px' : '12px')};
  color: ${props => props.color};
  .icon {
    width: ${props => (props.size === 'sm' ? '12px' : '15px')};
    height: ${props => (props.size === 'sm' ? '12px' : '15px')};
  }

  &:hover {
    color: black;
  }
`
TopRightButton.displayName = 'TopRightButton'

export const CloseButton = ({
  onClick,
  size,
  color,
  position,
  ...otherProps
}) => (
  <TopRightButton
    onClick={onClick}
    size={size}
    color={color}
    position={position}
    {...otherProps}
  >
    <CloseIcon />
  </TopRightButton>
)
CloseButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'lg']),
  onClick: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['absolute', 'fixed']),
  color: PropTypes.oneOf(Object.values(v.colors)),
}
CloseButton.defaultProps = {
  size: 'sm',
  color: v.colors.commonDark,
  position: 'absolute',
}

export const CircledIcon = styled.button`
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 32px;
  justify-content: center;
  position: relative;
  width: 32px;
  ${props =>
    props.active && `background-color: ${v.colors.commonMedium};`} &:hover {
    background-color: ${v.colors.commonMedium};
  }

  .icon {
    height: 20px;
    width: 20px;
  }
`
CircledIcon.displayName = 'StyledCircledIcon'

export const NotificationButton = styled.button`
  background-color: ${props =>
    props.read ? v.colors.commonMedium : v.colors.alert};
  border-radius: 50%;
  cursor: ${props => (props.read ? 'default' : 'pointer')};
  display: inline-block;
  height: 12px;
  transition: ${v.transitionWithDelay};
  width: 12px;
`
NotificationButton.displayName = 'NotificationButton'

export const AddButton = styled.div`
  display: inline-block;
  vertical-align: top;
  margin-right: 0;
  width: 32px;
  height: 32px;
  border-radius: 32px;
  background-color: white;
  color: ${v.colors.black};
  line-height: 32px;
  font-size: 1.5rem;
  text-align: center;
  cursor: pointer;
`
AddButton.displayName = 'AddButton'

export const LeaveButton = styled.button`
  margin-top: 8px;
  width: 16px;
`
LeaveButton.displayName = 'StyledLeaveIconHolder'
