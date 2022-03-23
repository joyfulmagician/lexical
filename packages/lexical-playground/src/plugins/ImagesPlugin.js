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
import {$getSelection, $isRangeSelection, $isRootNode} from 'lexical';
import {useEffect} from 'react';

import yellowFlowerImage from '../images/yellow-flower.jpg';
import {$createImageNode, ImageNode} from '../nodes/ImageNode';

const EditorPriority: CommandListenerEditorPriority = 0;

export default function ImagesPlugin(): React$Node {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return editor.registerListener(
      'command',
      (type) => {
        if (type === 'insertImage') {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            if ($isRootNode(selection.anchor.getNode())) {
              selection.insertParagraph();
            }
            const imageNode = $createImageNode(
              yellowFlowerImage,
              'Yellow flower in tilt shift lens',
              500,
            );
            selection.insertNodes([imageNode]);
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
