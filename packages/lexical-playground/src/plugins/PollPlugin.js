/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {CommandListenerEditorPriority} from 'lexical';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useEffect} from 'react';
import {$log, $getSelection} from 'lexical';
import {$createPollNode, PollNode} from '../nodes/PollNode';

const EditorPriority: CommandListenerEditorPriority = 0;

export default function PollPlugin(): React$Node {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!editor.hasNodes([PollNode])) {
      throw new Error('PollPlugin: PollNode not registered on editor');
    }

    return editor.addListener(
      'command',
      (type, payload) => {
        if (type === 'insertPoll') {
          $log('insertImage');
          const selection = $getSelection();
          if (selection !== null) {
            const question: string = payload;
            const pollNode = $createPollNode(question);
            selection.insertNodes([pollNode]);
          }
          return true;
        }
        return false;
      },
      EditorPriority,
    );
  }, [editor]);
  return null;
}
