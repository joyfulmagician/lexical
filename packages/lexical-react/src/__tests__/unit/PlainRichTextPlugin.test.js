/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import {$textContentCurry} from '@lexical/helpers/root';
import LexicalContentEditable from '@lexical/react/LexicalContentEditable';
import {$createParagraphNode, $createTextNode, $getRoot} from 'lexical';
import ExtendedNodes from 'lexical/ExtendedNodes';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils from 'react-dom/test-utils';

import LexicalComposer from '../../../src/LexicalComposer';
import PlainTextPlugin from '../../../src/LexicalPlainTextPlugin';
import RichTextPlugin from '../../../src/LexicalRichTextPlugin';
import {useLexicalComposerContext} from '../../LexicalComposerContext';

describe('LexicalNodeHelpers tests', () => {
  let container = null;
  let reactRoot;

  beforeEach(() => {
    container = document.createElement('div');
    reactRoot = ReactDOM.createRoot(container);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;

    jest.restoreAllMocks();
  });

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const plugin of ['PlainTextPlugin', 'RichTextPlugin']) {
    it(`${plugin} custom initialEditorState`, async () => {
      let editor;

      function GrabEditor() {
        [editor] = useLexicalComposerContext();
        return null;
      }
      const $initialEditorState = () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode('foo')),
        );
      };

      function App() {
        return (
          <LexicalComposer
            initialConfig={{
              namespace: 'PlaygroundEditor',
              nodes: plugin === 'PlainTextPlugin' ? [] : [...ExtendedNodes],
              theme: {},
            }}>
            <GrabEditor />
            {plugin === 'PlainTextPlugin' ? (
              <PlainTextPlugin
                contentEditable={<LexicalContentEditable />}
                initialEditorState={$initialEditorState}
              />
            ) : (
              <RichTextPlugin
                contentEditable={<LexicalContentEditable />}
                initialEditorState={$initialEditorState}
              />
            )}
          </LexicalComposer>
        );
      }

      await ReactTestUtils.act(async () => {
        reactRoot.render(<App />);
      });

      const text = editor.getEditorState().read($textContentCurry);
      expect(text).toBe('foo');
    });
  }
});
