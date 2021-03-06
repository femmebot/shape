import ActionCableConsumer from '~/utils/ActionCableConsumer'
import ChannelManager from '~/utils/ChannelManager'

jest.mock('../../app/javascript/utils/ActionCableConsumer')

describe('ChannelManager', () => {
  beforeEach(() => {
    ChannelManager.channels = {}
  })

  describe('subscribe()', () => {
    let name, id, callbacks

    beforeEach(() => {
      name = 'Test1'
      id = 1
      callbacks = {
        channelConnected: jest.fn(),
        channelDisconnected: jest.fn(),
        channelReceivedData: jest.fn(),
        channelRejected: jest.fn(),
      }
      ChannelManager.subscribe(name, id, callbacks)
    })

    it('should add the channel to channels', () => {
      expect(Object.keys(ChannelManager.channels).length).toEqual(1)
    })

    it('should create an action cable subscription', () => {
      expect(ActionCableConsumer.subscriptions.create).toHaveBeenCalledWith(
        {
          channel: name,
          id,
        },
        {
          connected: callbacks.channelConnected,
          disconnected: callbacks.channelDisconnected,
          received: callbacks.channelReceivedData,
          rejected: callbacks.channelRejected,
        }
      )
    })

    describe('when the channel already exists', () => {
      let channel
      beforeEach(() => {
        name = 'Test2'
        id = 2
        ActionCableConsumer.subscriptions.create.mockReset()
        ActionCableConsumer.subscriptions.create.mockReturnValue({ a: 1 })
        ChannelManager.channels = {}
        ChannelManager.subscribe(name, id)
        channel = ChannelManager.subscribe(name, id, callbacks)
      })

      it('should not add the channel twice', () => {
        expect(ActionCableConsumer.subscriptions.create).toHaveBeenCalledTimes(
          1
        )
        expect(Object.keys(ChannelManager.channels).length).toEqual(1)
      })

      it('should still set the callbacks', () => {
        expect(channel.connected).toEqual(callbacks.channelConnected)
      })
    })
  })

  describe('unsubscribe()', () => {
    let channel_1
    beforeEach(() => {
      ActionCableConsumer.subscriptions.create.mockReturnValue({
        unsubscribe: jest.fn(),
      })
      ChannelManager.channels = {}
      channel_1 = ChannelManager.subscribe('Item', 1)
      ChannelManager.subscribe('Item', 2)
      ChannelManager.subscribe('Collection', 4)
      // now unsubscribe
      ChannelManager.unsubscribe('Item', 1)
    })

    it('should unsubscribe the indicated channel id', () => {
      expect(channel_1.unsubscribe).toHaveBeenCalled()
      expect(Object.keys(ChannelManager.channels)).toEqual([
        'Item_2',
        'Collection_4',
      ])
    })
  })

  describe('unsubscribeAllFromChannel()', () => {
    beforeEach(() => {
      ActionCableConsumer.subscriptions.create.mockReturnValue({
        unsubscribe: jest.fn(),
      })
      ChannelManager.channels = {}
      ChannelManager.subscribe('Item', 1)
      ChannelManager.subscribe('Item', 2)
      ChannelManager.subscribe('Collection', 4)
      ChannelManager.unsubscribeAllFromChannel('Item')
    })

    it('should remove all channels that match the type of channel', () => {
      expect(Object.keys(ChannelManager.channels).length).toEqual(1)
    })
  })
})
