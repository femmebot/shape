import { Quill } from 'react-quill'

const Inline = Quill.import('blots/inline')
const Parchment = Quill.import('parchment')

const dataAttributor = new Parchment.Attributor.Attribute(
  'data-comment-id',
  'data-comment-id'
)
Quill.register(dataAttributor)

// TODO: probably won't use this....
// class formatter does work well to persist formatting on newlines (better than inline)
const HighlightClass = new Parchment.Attributor.Class(
  'highlightClass',
  'highlighted',
  {
    scope: Parchment.Scope.BLOCK,
  }
)
Quill.register(HighlightClass, true)
// ------

class QuillTextHighlighter extends Inline {
  static create(value) {
    // NOTE: highlight uses <sub> as its HTML element
    const node = document.createElement('sub')
    dataAttributor.add(node, value)

    // add onClick handler...
    node.onclick = e => {
      e.preventDefault()
      // apiStore.find('comments', value)
      // console.log('here i am...', dataAttributor.value(node))
    }
    return node
  }

  static formats(node) {
    // preserve data attribute if already set
    return dataAttributor.value(node)
  }
}

QuillTextHighlighter.blotName = 'commentHighlight'
QuillTextHighlighter.tagName = ['sub']

export default QuillTextHighlighter
