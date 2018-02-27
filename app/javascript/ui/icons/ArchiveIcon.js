import { propTypes, defaultProps } from './iconProps'

const ArchiveIcon = ({ color, width, height }) => (
  <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
    <path d="M3.353 3.55v25.7c.016.54.258 1.48 1.706 1.52 3.441.09 31.138.04 31.417.04.798-.03 1.212-.57 1.212-1.62l-.001-18.6c.001-.04-.001-.6-.349-.95-.265-.26-.723-.4-1.359-.4-3.334 0-17.298-.05-17.298-.05-.385 0-.755-.15-1.033-.42l-5.44-5.22H3.353zm17.552 30.28c-7.074 0-14.239-.02-15.925-.06-3.404-.09-4.632-2.75-4.627-4.52V2.05c0-.82.671-1.5 1.5-1.5h10.959c.387 0 .759.15 1.038.42l5.442 5.22c2.707.01 13.769.05 16.687.05 1.865 0 2.954.73 3.539 1.34 1.21 1.27 1.175 2.9 1.168 3.08l.002 18.53c0 1.77-.69 2.82-1.268 3.4-1.19 1.18-2.734 1.22-2.941 1.22h-.008c-.584 0-8.024.02-15.566.02z" fill={color} fillRule="evenodd" />
  </svg>
)

ArchiveIcon.propTypes = { ...propTypes }
ArchiveIcon.defaultProps = { ...defaultProps }

export default ArchiveIcon
