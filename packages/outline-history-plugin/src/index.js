// @flow strict-local

import type {OutlineEditor, ViewModel} from 'outline';
import {TextNode} from 'outline';
import {isRedo, isUndo} from 'plugin-shared/src/hotKeys';

import {useEffect, useMemo} from 'react';

function shouldMerge(
  viewModel: ViewModel,
  current: null | ViewModel,
  undoStack: Array<ViewModel>,
): boolean {
  if (current === null || undoStack.length === 0) {
    return false;
  }
  const hadDirtyNodes = current.hasDirtyNodes();
  const hasDirtyNodes = viewModel.hasDirtyNodes();
  // If we are changing selection between view models, then merge.
  if (!hadDirtyNodes && !hasDirtyNodes) {
    return true;
  } else if (hadDirtyNodes && hasDirtyNodes) {
    const dirtyNodes = viewModel.getDirtyNodes();
    if (dirtyNodes.length === 1) {
      const prevNodeMap = current.nodeMap;
      const nextDirtyNode = dirtyNodes[0];
      const prevDirtyNodeKey = nextDirtyNode._key;
      const prevDirtyNode = prevNodeMap[prevDirtyNodeKey];
      if (
        prevDirtyNode !== undefined &&
        prevDirtyNode instanceof TextNode &&
        prevDirtyNode._flags === nextDirtyNode._flags &&
        prevDirtyNode._text !== ''
      ) {
        return true;
      }
    }
  }
  return false;
}

export function useHistoryPlugin(editor: null | OutlineEditor): void {
  const historyState: {
    current: null | ViewModel,
    redoStack: Array<ViewModel>,
    undoStack: Array<ViewModel>,
  } = useMemo(
    () => ({
      current: null,
      redoStack: [],
      undoStack: [],
    }),
    [],
  );

  useEffect(() => {
    if (editor !== null) {
      const undoStack = historyState.undoStack;
      const editorElement = editor.getEditorElement();
      if (editorElement === null) {
        return;
      }
      let redoStack = historyState.redoStack;

      const applyChange = (viewModel) => {
        const current = historyState.current;

        if (viewModel === current) {
          return;
        }
        if (
          !viewModel.isHistoric &&
          !shouldMerge(viewModel, current, undoStack)
        ) {
          if (redoStack.length !== 0) {
            redoStack = historyState.redoStack = [];
          }
          if (current !== null) {
            undoStack.push(current);
          }
        }
        historyState.current = viewModel;
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (editor.isComposing()) {
          return;
        }
        if (isUndo(event)) {
          const undoStackLength = undoStack.length;
          if (undoStackLength !== 0) {
            let current = historyState.current;

            if (current !== null) {
              if (undoStackLength !== 1 && !current.hasDirtyNodes()) {
                current = undoStack.pop();
              }
              redoStack.push(current);
            }
            const viewModel = undoStack.pop();
            historyState.current = viewModel;
            viewModel.isHistoric = true;
            editor.setViewModel(viewModel);
          }
        } else if (isRedo(event)) {
          if (redoStack.length !== 0) {
            const current = historyState.current;

            if (current !== null) {
              undoStack.push(current);
            }
            const viewModel = redoStack.pop();
            historyState.current = viewModel;
            viewModel.isHistoric = true;
            editor.setViewModel(viewModel);
          }
        }
      };

      const removeUpdateListener = editor.addUpdateListener(applyChange);
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown);
        removeUpdateListener();
      };
    }
  }, [historyState, editor]);
}
