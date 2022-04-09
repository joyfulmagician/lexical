let container = null;
let React;
let ReactDOM;
let ReactTestUtils;
let Outline;
let SelectionHelpers;
let ParagraphNode;

const FORMAT_BOLD = 0;
const FORMAT_ITALIC = 1;
const FORMAT_STRIKETHROUGH = 2;
const FORMAT_UNDERLINE = 3;

function sanitizeHTML(html) {
  // Remove the special space characters
  return html.replace(/\uFEFF/g, '');
}

function printWhitespace(whitespaceCharacter) {
  return whitespaceCharacter.charCodeAt(0) === 160
    ? '&nbsp;'
    : whitespaceCharacter;
}

function insertText(text) {
  return {
    type: 'insert_text',
    text,
  };
}

function insertImmutableNode(text) {
  return {
    type: 'insert_immutable_node',
    text,
  };
}

function insertSegmentedNode(text) {
  return {
    type: 'insert_segmented_node',
    text,
  };
}

function convertToImmutableNode() {
  return {
    type: 'covert_to_immutable_node',
    text: null,
  };
}

function convertToSegmentedNode() {
  return {
    type: 'covert_to_segmented_node',
    text: null,
  };
}

function insertParagraph(text) {
  return {
    type: 'insert_paragraph',
  };
}

function deleteWordBackward() {
  return {
    type: 'delete_word_backward',
    text: null,
  };
}

function deleteWordForward() {
  return {
    type: 'delete_word_forward',
    text: null,
  };
}

function deleteBackward() {
  return {
    type: 'delete_backward',
    text: null,
  };
}

function deleteForward() {
  return {
    type: 'delete_forward',
    text: null,
  };
}

function formatBold() {
  return {
    type: 'format_text',
    format: FORMAT_BOLD,
  };
}

function formatItalic() {
  return {
    type: 'format_text',
    format: FORMAT_ITALIC,
  };
}

function formatStrikeThrough() {
  return {
    type: 'format_text',
    format: FORMAT_STRIKETHROUGH,
  };
}

function formatUnderline() {
  return {
    type: 'format_text',
    format: FORMAT_UNDERLINE,
  };
}

function moveNativeSelection(anchorPath, anchorOffset, focusPath, focusOffset) {
  return {
    type: 'move_native_selection',
    anchorPath,
    anchorOffset,
    focusPath,
    focusOffset,
  };
}

function getNodeFromPath(path, editorElement) {
  let node = editorElement;
  for (let i = 0; i < path.length; i++) {
    node = node.childNodes[path[i]];
  }
  return node;
}

function setNativeSelection(
  editorElement,
  anchorPath,
  anchorOffset,
  focusPath,
  focusOffset,
) {
  const anchorNode = getNodeFromPath(anchorPath, editorElement);
  const focusNode = getNodeFromPath(focusPath, editorElement);
  const domSelection = window.getSelection();
  const range = document.createRange();
  range.setStart(anchorNode, anchorOffset);
  range.setEnd(focusNode, focusOffset);
  domSelection.removeAllRanges();
  domSelection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

function applySelectionInputs(inputs, update, editor) {
  const editorElement = editor.getEditorElement();
  inputs.forEach((input) => {
    update((view) => {
      const selection = view.getSelection();

      switch (input.type) {
        case 'insert_text': {
          SelectionHelpers.insertText(selection, input.text);
          break;
        }
        case 'insert_paragraph': {
          SelectionHelpers.insertParagraph(selection);
          break;
        }
        case 'delete_backward': {
          SelectionHelpers.deleteBackward(selection);
          break;
        }
        case 'delete_forward': {
          SelectionHelpers.deleteForward(selection);
          break;
        }
        case 'delete_word_backward': {
          SelectionHelpers.deleteWordBackward(selection);
          break;
        }
        case 'delete_word_forward': {
          SelectionHelpers.deleteWordForward(selection);
          break;
        }
        case 'format_text': {
          SelectionHelpers.formatText(selection, input.format);
          break;
        }
        case 'move_native_selection': {
          setNativeSelection(
            editorElement,
            input.anchorPath,
            input.anchorOffset,
            input.focusPath,
            input.focusOffset,
          );
          break;
        }
        case 'insert_immutable_node': {
          const text = Outline.createTextNode(input.text);
          text.makeImmutable();
          SelectionHelpers.insertNodes(selection, [text]);
          text.selectAfter();
          break;
        }
        case 'insert_segmented_node': {
          const text = Outline.createTextNode(input.text);
          text.makeSegmented();
          SelectionHelpers.insertNodes(selection, [text]);
          text.selectAfter();
          break;
        }
        case 'covert_to_immutable_node': {
          const text = Outline.createTextNode(selection.getTextContent());
          text.makeImmutable();
          SelectionHelpers.insertNodes(selection, [text]);
          text.selectAfter();
          break;
        }
        case 'covert_to_segmented_node': {
          const text = Outline.createTextNode(selection.getTextContent());
          text.makeSegmented();
          SelectionHelpers.insertNodes(selection, [text]);
          text.selectAfter();
          break;
        }
        default:
          console.log('TODO');
      }
    });
  });
}

describe('OutlineSelection tests', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    Outline = require('outline');
    SelectionHelpers = require('outline-react/OutlineSelectionHelpers');
    ParagraphNode = require('outline-extensions/ParagraphNode');

    container = document.createElement('div');
    document.body.appendChild(container);
    init();
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  function useOutlineEditor(editorElementRef) {
    const editor = React.useMemo(() => Outline.createEditor(), []);

    React.useEffect(() => {
      const editorElement = editorElementRef.current;

      editor.setEditorElement(editorElement);
    }, [editorElementRef, editor]);

    return editor;
  }

  let editor = null;
  let ref;

  function init() {
    ref = React.createRef();

    function TestBase() {
      editor = useOutlineEditor(ref);
      return <div ref={ref} contentEditable={true} />;
    }

    ReactTestUtils.act(() => {
      ReactDOM.render(<TestBase />, container);
    });
    ref.current.focus();
  }

  function emptySetup() {
    // Insert initial block
    update((view) => {
      const paragraph = ParagraphNode.createParagraphNode();
      const text = Outline.createTextNode();
      paragraph.append(text);
      view.getRoot().append(paragraph);
    });

    // Focus first element
    setNativeSelection(ref.current, [0, 0, 0], 0, [0, 0, 0], 0);
  }

  function update(callback) {
    editor.update(callback, true);
  }

  test('Expect initial output to be a block with some text', () => {
    emptySetup();
    expect(sanitizeHTML(container.innerHTML)).toBe(
      '<div contenteditable="true"><p><span data-text="true"><br></span></p></div>',
    );
  });

  // eslint-disable-next-line no-unused-vars
  const GRAPHEME_SCENARIOS = [
    {
      description: 'grapheme cluster',
      // Hangul grapheme cluster.
      // https://www.compart.com/en/unicode/U+AC01
      grapheme: '\u1100\u1161\u11A8',
    },
    {
      description: 'extended grapheme cluster',
      // Tamil 'ni' grapheme cluster.
      // http://unicode.org/reports/tr29/#Table_Sample_Grapheme_Clusters
      grapheme: '\u0BA8\u0BBF',
    },
    {
      description: 'tailored grapheme cluster',
      // Devangari 'kshi' tailored grapheme cluster.
      // http://unicode.org/reports/tr29/#Table_Sample_Grapheme_Clusters
      grapheme: '\u0915\u094D\u0937\u093F',
    },
    {
      description: 'Emoji sequence combined using zero-width joiners',
      // https://emojipedia.org/family-woman-woman-girl-boy/
      grapheme:
        '\uD83D\uDC69\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66',
    },
    {
      description: 'Emoji sequence with skin-tone modifier',
      // https://emojipedia.org/clapping-hands-medium-skin-tone/
      grapheme: '\uD83D\uDC4F\uD83C\uDFFD',
    },
  ];

  const suite = [
    {
      name: 'Simple typing',
      inputs: [
        insertText('H'),
        insertText('e'),
        insertText('l'),
        insertText('l'),
        insertText('o'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 5,
        focusPath: [0, 0, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },

    {
      name: 'Simple typing in bold',
      inputs: [
        formatBold(),
        insertText('H'),
        insertText('e'),
        insertText('l'),
        insertText('l'),
        insertText('o'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><strong data-text="true">Hello</strong></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 5,
        focusPath: [0, 0, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Simple typing in italic',
      inputs: [
        formatItalic(),
        insertText('H'),
        insertText('e'),
        insertText('l'),
        insertText('l'),
        insertText('o'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><em data-text="true">Hello</em></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 5,
        focusPath: [0, 0, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Simple typing in underline',
      inputs: [
        formatUnderline(),
        insertText('H'),
        insertText('e'),
        insertText('l'),
        insertText('l'),
        insertText('o'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr">' +
        '<span data-text="true" style="text-decoration: underline;">Hello</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 5,
        focusPath: [0, 0, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Simple typing in strikethrough',
      inputs: [
        formatStrikeThrough(),
        insertText('H'),
        insertText('e'),
        insertText('l'),
        insertText('l'),
        insertText('o'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr">' +
        '<span data-text="true" style="text-decoration: line-through;">Hello</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 5,
        focusPath: [0, 0, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Deletion',
      inputs: [
        insertText('1'),
        insertText('2'),
        insertText('3'),
        deleteBackward(),
        insertText('4'),
        insertText('5'),
        deleteBackward(),
        insertText('6'),
        deleteForward(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p><span data-text="true">1246</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 4,
        focusPath: [0, 0, 0],
        focusOffset: 4,
      },
      setup: emptySetup,
    },
    {
      name: 'Creation of an immutable node',
      inputs: [insertImmutableNode('Dominic Gannaway')],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true"></span>' +
        '<span data-text="true">Dominic Gannaway</span>' +
        '<span data-text="true"></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Convert text to an immutable node',
      inputs: [
        insertText('Dominic Gannaway'),
        moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 16),
        convertToImmutableNode(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true"></span>' +
        '<span data-text="true">Dominic Gannaway</span>' +
        '<span data-text="true"></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Deletion of an immutable node',
      inputs: [insertImmutableNode('Dominic Gannaway'), deleteBackward()],
      expectedHTML:
        '<div contenteditable="true"><p><span data-text="true"><br></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 0,
        focusPath: [0, 0, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Creation of a segmented node',
      inputs: [insertSegmentedNode('Dominic Gannaway')],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true"></span>' +
        '<span data-text="true">Dominic Gannaway</span>' +
        '<span data-text="true"></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Convert text to a segmented node',
      inputs: [
        insertText('Dominic Gannaway'),
        moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 16),
        convertToSegmentedNode(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true"></span>' +
        '<span data-text="true">Dominic Gannaway</span>' +
        '<span data-text="true"></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Deletion of part of a segmented node',
      inputs: [insertSegmentedNode('Dominic Gannaway'), deleteBackward()],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true"></span>' +
        '<span data-text="true">Dominic</span>' +
        '<span data-text="true"></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    // Tests need fixing:

    // ...GRAPHEME_SCENARIOS.flatMap(({description, grapheme}) => [
    //   {
    //     name: `Delete backward eliminates entire ${description} (${grapheme})`,
    //     inputs: [insertText(grapheme + grapheme), deleteBackward()],
    //     expectedHTML: `<div contenteditable="true"><p dir=\"ltr\"><span data-text="true">${grapheme}</span></p></div>`,
    //     expectedSelection: {
    //       anchorPath: [0, 0, 0],
    //       anchorOffset: grapheme.length,
    //       focusPath: [0, 0, 0],
    //       focusOffset: grapheme.length,
    //     },
    //     setup: emptySetup,
    //   },
    //   {
    //     name: `Delete forward eliminates entire ${description} (${grapheme})`,
    //     inputs: [
    //       insertText(grapheme + grapheme),
    //       moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 0),
    //       deleteForward(),
    //     ],
    //     expectedHTML: `<div contenteditable="true"><p dir=\"ltr\"><span data-text="true">${grapheme}</span></p></div>`,
    //     expectedSelection: {
    //       anchorPath: [0, 0, 0],
    //       anchorOffset: 0,
    //       focusPath: [0, 0, 0],
    //       focusOffset: 0,
    //     },
    //     setup: emptySetup,
    //   },
    //   {
    //     name: `Move backward skips over grapheme cluster (${grapheme})`,
    //     inputs: [insertText(grapheme + grapheme), moveBackward()],
    //     expectedHTML: `<div contenteditable="true"><p dir=\"ltr\"><span data-text="true">${grapheme}${grapheme}</span></p></div>`,
    //     expectedSelection: {
    //       anchorPath: [0, 0, 0],
    //       anchorOffset: grapheme.length,
    //       focusPath: [0, 0, 0],
    //       focusOffset: grapheme.length,
    //     },
    //     setup: emptySetup,
    //   },
    //   {
    //     name: `Move forward skips over grapheme cluster (${grapheme})`,
    //     inputs: [
    //       insertText(grapheme + grapheme),
    //       moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 0),
    //       moveForward(),
    //     ],
    //     expectedHTML: `<div contenteditable="true"><p dir=\"ltr\"><span data-text="true">${grapheme}${grapheme}</span></p></div>`,
    //     expectedSelection: {
    //       anchorPath: [0, 0, 0],
    //       anchorOffset: grapheme.length,
    //       focusPath: [0, 0, 0],
    //       focusOffset: grapheme.length,
    //     },
    //     setup: emptySetup,
    //   },
    // ]),
    {
      name: 'Jump to beginning and insert',
      inputs: [
        insertText('1'),
        insertText('1'),
        insertText('2'),
        insertText('3'),
        moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 0),
        insertText('a'),
        insertText('b'),
        insertText('c'),
        deleteForward(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">abc123</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 3,
        focusPath: [0, 0, 0],
        focusOffset: 3,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and replace',
      inputs: [
        insertText('Hello draft!'),
        moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 11),
        insertText('outline'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello outline!</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 13,
        focusPath: [0, 0, 0],
        focusOffset: 13,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and bold',
      inputs: [
        insertText('Hello draft!'),
        moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 11),
        formatBold(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello </span>' +
        '<strong data-text="true">draft</strong><span data-text="true">!</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 1, 0],
        anchorOffset: 0,
        focusPath: [0, 1, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and italic',
      inputs: [
        insertText('Hello draft!'),
        moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 11),
        formatItalic(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello </span>' +
        '<em data-text="true">draft</em><span data-text="true">!</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 1, 0],
        anchorOffset: 0,
        focusPath: [0, 1, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and bold + italic',
      inputs: [
        insertText('Hello draft!'),
        moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 11),
        formatBold(),
        formatItalic(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello </span>' +
        '<strong data-text="true" style="font-style: italic;">draft</strong><span data-text="true">!</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 1, 0],
        anchorOffset: 0,
        focusPath: [0, 1, 0],
        focusOffset: 5,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and replace all',
      inputs: [
        insertText('This is broken.'),
        moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 15),
        insertText('This works!'),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">This works!</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 11,
        focusPath: [0, 0, 0],
        focusOffset: 11,
      },
      setup: emptySetup,
    },
    {
      name: 'Select and delete',
      inputs: [
        insertText('A lion.'),
        moveNativeSelection([0, 0, 0], 2, [0, 0, 0], 6),
        deleteForward(),
        insertText('duck'),
        moveNativeSelection([0, 0, 0], 2, [0, 0, 0], 6),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">A duck.</span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 2,
        focusPath: [0, 0, 0],
        focusOffset: 6,
      },
      setup: emptySetup,
    },
    {
      name: 'Inserting a paragraph',
      inputs: [insertParagraph()],
      expectedHTML:
        '<div contenteditable="true"><p><span data-text="true"><br></span></p>' +
        '<p><span data-text="true"><br></span></p></div>',
      expectedSelection: {
        anchorPath: [1, 0, 0],
        anchorOffset: 0,
        focusPath: [1, 0, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Inserting a paragraph and then removing it',
      inputs: [insertParagraph(), deleteBackward()],
      expectedHTML:
        '<div contenteditable="true"><p><span data-text="true"><br></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 0,
        focusPath: [0, 0, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Inserting a paragraph part way through text',
      inputs: [
        insertText('Hello world'),
        moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 6),
        insertParagraph(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello </span></p>' +
        '<p dir="ltr"><span data-text="true">world</span></p></div>',
      expectedSelection: {
        anchorPath: [1, 0, 0],
        anchorOffset: 0,
        focusPath: [1, 0, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    {
      name: 'Inserting two paragraphs and then deleting via selection',
      inputs: [
        insertText('123'),
        insertParagraph(),
        insertText('456'),
        moveNativeSelection([0, 0, 0], 0, [1, 0, 0], 3),
        deleteBackward(),
      ],
      expectedHTML:
        '<div contenteditable="true"><p><span data-text="true"><br></span></p></div>',
      expectedSelection: {
        anchorPath: [0, 0, 0],
        anchorOffset: 0,
        focusPath: [0, 0, 0],
        focusOffset: 0,
      },
      setup: emptySetup,
    },
    ...[
      {whitespaceCharacter: ' ', whitespaceName: 'space'},
      {whitespaceCharacter: '\u00a0', whitespaceName: 'non-breaking space'},
      {whitespaceCharacter: '\u2000', whitespaceName: 'en quad'},
      {whitespaceCharacter: '\u2001', whitespaceName: 'em quad'},
      {whitespaceCharacter: '\u2002', whitespaceName: 'en space'},
      {whitespaceCharacter: '\u2003', whitespaceName: 'em space'},
      {whitespaceCharacter: '\u2004', whitespaceName: 'three-per-em space'},
      {whitespaceCharacter: '\u2005', whitespaceName: 'four-per-em space'},
      {whitespaceCharacter: '\u2006', whitespaceName: 'six-per-em space'},
      {whitespaceCharacter: '\u2007', whitespaceName: 'figure space'},
      {whitespaceCharacter: '\u2008', whitespaceName: 'punctuation space'},
      {whitespaceCharacter: '\u2009', whitespaceName: 'thin space'},
      {whitespaceCharacter: '\u200A', whitespaceName: 'hair space'},
    ].flatMap(({whitespaceCharacter, whitespaceName}) => [
      {
        name: `Type two words separated by a ${whitespaceName}, delete word backward from end`,
        inputs: [
          insertText(`Hello${whitespaceCharacter}world`),
          deleteWordBackward(),
        ],
        expectedHTML: `<div contenteditable=\"true\"><p dir=\"ltr\"><span data-text=\"true\">Hello${printWhitespace(
          whitespaceCharacter,
        )}</span></p></div>`,
        expectedSelection: {
          anchorPath: [0, 0, 0],
          anchorOffset: 6,
          focusPath: [0, 0, 0],
          focusOffset: 6,
        },
        setup: emptySetup,
      },
      {
        name: `Type two words separated by a ${whitespaceName}, delete word forward from beginning`,
        inputs: [
          insertText(`Hello${whitespaceCharacter}world`),
          moveNativeSelection([0, 0, 0], 0, [0, 0, 0], 0),
          deleteWordForward(),
        ],
        expectedHTML: `<div contenteditable=\"true\"><p dir=\"ltr\"><span data-text=\"true\">${printWhitespace(
          whitespaceCharacter,
        )}world</span></p></div>`,
        expectedSelection: {
          anchorPath: [0, 0, 0],
          anchorOffset: 0,
          focusPath: [0, 0, 0],
          focusOffset: 0,
        },
        setup: emptySetup,
      },
      {
        name: `Type two words separated by a ${whitespaceName}, delete word forward from beginning of preceding whitespace`,
        inputs: [
          insertText(`Hello${whitespaceCharacter}world`),
          moveNativeSelection([0, 0, 0], 5, [0, 0, 0], 5),
          deleteWordForward(),
        ],
        expectedHTML:
          '<div contenteditable="true"><p dir="ltr"><span data-text="true">Hello</span></p></div>',
        expectedSelection: {
          anchorPath: [0, 0, 0],
          anchorOffset: 5,
          focusPath: [0, 0, 0],
          focusOffset: 5,
        },
        setup: emptySetup,
      },
      {
        name: `Type two words separated by a ${whitespaceName}, delete word backward from end of trailing whitespace`,
        inputs: [
          insertText(`Hello${whitespaceCharacter}world`),
          moveNativeSelection([0, 0, 0], 6, [0, 0, 0], 6),
          deleteWordBackward(),
        ],
        expectedHTML:
          '<div contenteditable="true"><p dir="ltr"><span data-text="true">world</span></p></div>',
        expectedSelection: {
          anchorPath: [0, 0, 0],
          anchorOffset: 0,
          focusPath: [0, 0, 0],
          focusOffset: 0,
        },
        setup: emptySetup,
      },
    ]),
  ];

  suite.forEach((testUnit, i) => {
    const name = testUnit.name || 'Test case';
    test(name + ` (#${i + 1})`, () => {
      testUnit.setup();
      applySelectionInputs(testUnit.inputs, update, editor);
      // Validate HTML matches
      expect(sanitizeHTML(container.innerHTML)).toBe(testUnit.expectedHTML);
      // Validate selection matches
      const editorElement = editor.getEditorElement();
      const acutalSelection = window.getSelection();
      const expectedSelection = testUnit.expectedSelection;
      expect(acutalSelection.anchorNode).toBe(
        getNodeFromPath(expectedSelection.anchorPath, editorElement),
      );
      expect(acutalSelection.anchorOffset).toBe(expectedSelection.anchorOffset);
      expect(acutalSelection.focusNode).toBe(
        getNodeFromPath(expectedSelection.focusPath, editorElement),
      );
      expect(acutalSelection.focusOffset).toBe(expectedSelection.focusOffset);
    });
  });
});
