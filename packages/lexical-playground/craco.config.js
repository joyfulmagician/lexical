module.exports = {
  babel: {
    plugins: [['babel-plugin-transform-stylex', {dev: true}]],
  },
  webpack: {
    alias: {
      // Lexical Core Nodes
      'lexical/HeadingNode': 'lexical/dist/LexicalHeadingNode',
      'lexical/ListNode': 'lexical/dist/LexicalListNode',
      'lexical/ListItemNode': 'lexical/dist/LexicalListItemNode',
      'lexical/TableNode': 'lexical/dist/LexicalTableNode',
      'lexical/TableRowNode': 'lexical/dist/LexicalTableRowNode',
      'lexical/TableCellNode': 'lexical/dist/LexicalTableCellNode',
      'lexical/QuoteNode': 'lexical/dist/LexicalQuoteNode',
      'lexical/ParagraphNode': 'lexical/dist/LexicalParagraphNode',
      'lexical/CodeNode': 'lexical/dist/LexicalCodeNode',
      'lexical/LinkNode': 'lexical/dist/LexicalLinkNode',
      'lexical/AutoLinkNode': 'lexical/dist/LexicalAutoLinkNode',
      'lexical/HashtagNode': 'lexical/dist/LexicalHashtagNode',
      'lexical/CodeHighlightNode': 'lexical/dist/LexicalCodeHighlightNode',
      // Lexical Helpers
      '@lexical/helpers/selection':
        '@lexical/helpers/dist/LexicalSelectionHelpers',
      '@lexical/helpers/text': '@lexical/helpers/dist/LexicalTextHelpers',
      '@lexical/helpers/nodes': '@lexical/helpers/dist/LexicalNodeHelpers',
      '@lexical/helpers/elements':
        '@lexical/helpers/dist/LexicalElementHelpers',
      '@lexical/helpers/events': '@lexical/helpers/dist/LexicalEventHelpers',
      '@lexical/helpers/file': '@lexical/helpers/dist/LexicalFileHelpers',
      '@lexical/helpers/offsets': '@lexical/helpers/dist/LexicalOffsetHelpers',
      '@lexical/helpers/root': '@lexical/helpers/dist/LexicalRootHelpers',

      // Lexical React
      '@lexical/react/LexicalTreeView': '@lexical/react/dist/LexicalTreeView',
      '@lexical/react/useLexicalEditor': '@lexical/react/dist/useLexicalEditor',
      '@lexical/react/DEPRECATED_useLexicalRichText':
        '@lexical/react/dist/DEPRECATED_useLexicalRichText',
      '@lexical/react/DEPRECATED_useLexicalPlainText':
        '@lexical/react/dist/DEPRECATED_useLexicalPlainText',
      '@lexical/react/DEPRECATED_useLexicalEditorEvents':
        '@lexical/react/dist/DEPRECATED_useLexicalEditorEvents',
      '@lexical/react/DEPRECATED_useLexicalAutoFormatter':
        '@lexical/react/dist/DEPRECATED_useLexicalAutoFormatter',
      '@lexical/react/DEPRECATED_useLexicalDecorators':
        '@lexical/react/dist/DEPRECATED_useLexicalDecorators',
      '@lexical/react/DEPRECATED_useLexicalList':
        '@lexical/react/dist/DEPRECATED_useLexicalList',
      '@lexical/react/useLexicalIsBlank':
        '@lexical/react/dist/useLexicalIsBlank',
      '@lexical/react/useLexicalIsTextContentEmpty':
        '@lexical/react/dist/useLexicalIsTextContentEmpty',
      '@lexical/react/DEPRECATED_useLexicalCanShowPlaceholder':
        '@lexical/react/dist/DEPRECATED_useLexicalCanShowPlaceholder',
      '@lexical/react/DEPRECATED_useLexicalCharacterLimit':
        '@lexical/react/dist/DEPRECATED_useLexicalCharacterLimit',
      '@lexical/react/DEPRECATED_useLexicalHistory':
        '@lexical/react/dist/DEPRECATED_useLexicalHistory',
      '@lexical/react/useLexicalDecoratorMap':
        '@lexical/react/dist/useLexicalDecoratorMap',
      '@lexical/react/withSubscriptions':
        '@lexical/react/dist/withSubscriptions',
      '@lexical/react/LexicalContentEditable':
        '@lexical/react/dist/LexicalContentEditable',
      '@lexical/react/LexicalNestedComposer':
        '@lexical/react/dist/LexicalNestedComposer',

      // Composer and it's plugins
      '@lexical/react/LexicalComposer': '@lexical/react/dist/LexicalComposer',
      '@lexical/react/LexicalComposerContext':
        '@lexical/react/dist/LexicalComposerContext',
      ...[
        'LexicalAutoFormatterPlugin',
        'LexicalCharacterLimitPlugin',
        'LexicalHashtagPlugin',
        'LexicalPlainTextPlugin',
        'LexicalRichTextPlugin',
        'LexicalCollaborationPlugin',
        'LexicalHistoryPlugin',
        'LexicalTablePlugin',
        'LexicalLinkPlugin',
        'LexicalAutoLinkPlugin',
        'LexicalListPlugin',
        'LexicalOnChangePlugin',
      ].reduce(
        (aliases, plugin) => ({
          ...aliases,
          [`@lexical/react/${plugin}`]: `@lexical/react/dist/${plugin}`,
        }),
        {},
      ),
      //Shared
      'shared/environment': 'shared/dist/environment',
      'shared/useLayoutEffect': 'shared/dist/useLayoutEffect',
    },
  },
};
