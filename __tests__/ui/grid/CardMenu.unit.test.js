import _ from 'lodash'
import CardMenu from '~/ui/grid/CardMenu'

const props = {
  cardId: 123,
  canEdit: false,
  handleShare: jest.fn(),
  handleDuplicate: jest.fn(),
  handleLink: jest.fn(),
  handleMove: jest.fn(),
  handleArchive: jest.fn(),
  handleReplace: jest.fn(),
  uiStore: {
    openCardMenuId: false,
    update: jest.fn(),
  },
  menuOpen: false,
}

// const fakeMouseEvent = { stopPropagation: jest.fn() }

let wrapper, actions
describe('CardMenu', () => {
  describe('as editor', () => {
    beforeEach(() => {
      actions = [
        'Duplicate',
        'Replace',
        'Move',
        'Link',
        'Archive'
      ]
      props.canEdit = true
      wrapper = shallow(
        <CardMenu {...props} />
      )
    })

    it('creates a PopoutMenu with all editable actions', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(actions.length)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })

  describe('as viewer', () => {
    beforeEach(() => {
      actions = ['Duplicate']
      props.canEdit = false
      wrapper = shallow(
        <CardMenu {...props} />
      )
    })

    it('creates a PopoutMenu with only 1 viewer action', () => {
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(popout.props().menuItems.length).toEqual(1)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(actions)
    })
  })
})
