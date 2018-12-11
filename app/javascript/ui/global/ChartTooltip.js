import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { Flyout, VictoryTooltip } from 'victory'

import v from '~/utils/variables'
import { theme } from '~/ui/test_collections/shared'

const DotFlyout = props => (
  <g>
    <Flyout {...props} />
    <circle
      cx={props.x}
      cy={props.y + 9}
      r="4"
      stroke={v.colors.white}
      strokeWidth={0.5}
      fill={v.colors.black}
    />
  </g>
)

class ChartTooltip extends React.Component {
  static defaultEvents = VictoryTooltip.defaultEvents

  get isLastDataPoint() {
    const { data, index } = this.props
    return parseInt(index) === data.length - 1
  }

  renderAmountMark(datum, totalData) {
    const { maxAmount, minAmount } = this.props
    if (datum.amount >= maxAmount) return true
    if (datum.amount <= minAmount) return true
    if (this.isLastDataPoint) return true
    return false
  }

  render() {
    const { data, datum, index, textRenderer, x, y } = this.props
    const showAlways = this.renderAmountMark(datum, data.length - 1)
    let dx = 0
    if (parseInt(index) === 0) {
      dx = 10
    } else if (this.isLastDataPoint) {
      dx = -10
    }
    const text = textRenderer(datum, this.isLastDataPoint)
    return (
      <g>
        <VictoryTooltip
          {...this.props}
          theme={theme}
          cornerRadius={2}
          flyoutComponent={<DotFlyout />}
          height={40}
          width={140}
          dx={dx * 5}
          dy={0}
          style={{
            fill: 'white',
            fontFamily: v.fonts.sans,
            fontSize: '12px',
            fontWeight: 'normal',
          }}
          text={text}
          orientation="top"
          pointerLength={0}
          flyoutStyle={{
            transform: 'translateY(-5px)',
            stroke: 'transparent',
            fill: v.colors.black,
            opacity: 0.8,
          }}
        />
        {showAlways && (
          <Fragment>
            <VictoryTooltip
              active={showAlways}
              {...this.props}
              dx={dx}
              dy={-5}
              style={{ fontSize: '10px', fontWeight: 'normal' }}
              text={`${datum.amount}`}
              orientation="top"
              pointerLength={0}
              flyoutStyle={{ stroke: 'transparent', fill: 'transparent' }}
            />
            <line
              x1={x}
              x2={x + 8}
              y1={y + 9}
              y2={y + 9}
              dx={dx}
              stroke="black"
              strokeWidth={0.75}
            />
          </Fragment>
        )}
      </g>
    )
  }
}
ChartTooltip.propTypes = {
  textRenderer: PropTypes.func.isRequired,
  maxAmount: PropTypes.number,
  minAmount: PropTypes.number,
}
ChartTooltip.defaultProps = {
  maxAmount: 0,
  minAmount: 0,
}

export default ChartTooltip