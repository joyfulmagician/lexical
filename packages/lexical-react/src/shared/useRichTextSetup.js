/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {InitialEditorStateType} from '@lexical/rich-text';
import type {LexicalEditor} from 'lexical';

import {registerDragonSupport} from '@lexical/dragon';
import withSubscriptions from '@lexical/react/withSubscriptions';
import {registerRichText} from '@lexical/rich-text';
import useLayoutEffect from 'shared/useLayoutEffect';

export default function useRichTextSetup(
  editor: LexicalEditor,
  initialEditorState?: InitialEditorStateType,
): void {
  useLayoutEffect(() => {
    return withSubscriptions(
      registerRichText(editor, initialEditorState),
      registerDragonSupport(editor),
    );
    // We only do this for init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);
}
