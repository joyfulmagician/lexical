// @flow strict-local

import type {OutlineEditor, View, NodeKey, EditorThemeClasses} from 'outline';

import {useEffect} from 'react';
import {TextNode, isTextNode} from 'outline';

const emojis: {[string]: [string, string]} = {
  ':)': ['emoji happysmile', '🙂'],
  ':D': ['emoji veryhappysmile', '😀'],
  ':(': ['emoji unhappysmile', '🙁'],
  '<3': ['emoji heart', '❤'],
};

function findAndTransformEmoji(node): null | TextNode {
  const text = node.getTextContent();
  for (let i = 0; i < text.length; i++) {
    const possibleEmoji = text.slice(i, i + 2);
    const emojiData = emojis[possibleEmoji];

    if (emojiData !== undefined) {
      const [emojiStyle, emojiText] = emojiData;
      let targetNode;
      if (i === 0) {
        [targetNode] = node.splitText(i + 2);
      } else {
        [, targetNode] = node.splitText(i, i + 2);
      }
      const emojiNode = createEmojiNode(emojiStyle, emojiText);
      targetNode.replace(emojiNode);
      const nextSibling = emojiNode.getNextSibling();
      if (isTextNode(nextSibling)) {
        nextSibling.select(0, 0);
        return nextSibling;
      }
      break;
    }
  }
  return null;
}

function textNodeTransform(node: TextNode, view: View): void {
  if (node.isSegmented() || node.isImmutable() || node.isHashtag()) {
    return;
  }

  let targetNode = node;
  let parentToNormalize = null;

  while (targetNode !== null) {
    targetNode = findAndTransformEmoji(targetNode);
    if (targetNode !== null) {
      parentToNormalize = targetNode.getParent();
    }
  }
  if (parentToNormalize !== null) {
    parentToNormalize.normalizeTextNodes(true);
  }
}

export default function useEmojis(editor: null | OutlineEditor): void {
  useEffect(() => {
    if (editor !== null) {
      editor.registerNodeType('emoji', EmojiNode);
      const removeTransform = editor.addTextNodeTransform(textNodeTransform);
      return () => {
        removeTransform();
      };
    }
  }, [editor]);
}

class EmojiNode extends TextNode {
  className: string;

  constructor(className: string, text: string, key?: NodeKey) {
    super(text, key);
    this.className = className;
    this.__type = 'emoji';
  }

  clone() {
    const clone = new EmojiNode(this.className, this.__text, this.__key);
    clone.__parent = this.__parent;
    clone.__flags = this.__flags;
    return clone;
  }
  createDOM(editorThemeClasses: EditorThemeClasses) {
    const dom = super.createDOM(editorThemeClasses);
    dom.className = this.className;
    return dom;
  }
}

function createEmojiNode(className: string, emojiText: string): EmojiNode {
  return new EmojiNode(className, emojiText).makeImmutable();
}
