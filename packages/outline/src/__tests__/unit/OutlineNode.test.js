/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {TextNode, getRoot, getSelection} from 'outline';
import {ParagraphNode} from 'outline/ParagraphNode';
import {OutlineNode} from '../../core/OutlineNode';

import {
  IS_DIRECTIONLESS,
  IS_IMMUTABLE,
  IS_INERT,
  IS_SEGMENTED,
} from '../../core/OutlineConstants';

import {initializeUnitTest, TestElementNode} from '../utils';

class TestNode extends OutlineNode {
  static getType(): string {
    return 'test';
  }
  static clone(node: TestNode) {
    return new TestNode(node.__key);
  }
  createDOM() {
    return document.createElement('div');
  }
}

describe('OutlineNode tests', () => {
  initializeUnitTest((testEnv) => {
    let paragraphNode;
    let textNode;

    beforeEach(async () => {
      const {editor} = testEnv;

      // This is a hack to bypass the node type validation on OutlineNode. We never want to create
      // an OutlineNode directly but we're testing the base functionality in this module.
      OutlineNode.getType = function () {
        return 'node';
      };
      editor.registerNodes([OutlineNode, TestNode]);

      await editor.update(() => {
        const rootNode = getRoot();
        paragraphNode = new ParagraphNode();
        textNode = new TextNode('foo');
        paragraphNode.append(textNode);
        rootNode.append(paragraphNode);
      });
    });

    afterEach(() => {
      OutlineNode.getType = undefined;
    });

    test('OutlineNode.constructor', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode('__custom_key__');
        expect(node.__type).toBe('node');
        expect(node.__flags).toBe(0);
        expect(node.__key).toBe('__custom_key__');
        expect(node.__parent).toBe(null);
      });
      await editor.getEditorState().read(() => {
        expect(() => new OutlineNode()).toThrow();
        expect(() => new OutlineNode('__custom_key__')).toThrow();
      });
    });

    test('OutlineNode.clone()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode('__custom_key__');
        expect(() => node.clone()).toThrow();
      });
    });

    test('OutlineNode.getType()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode('__custom_key__');
        expect(node.getType()).toEqual(node.__type);
      });
    });

    test('OutlineNode.isAttached()', async () => {
      const {editor} = testEnv;
      let node;
      await editor.update(() => {
        node = new OutlineNode('__custom_key__');
      });
      await editor.getEditorState().read(() => {
        expect(node.isAttached()).toBe(false);
        expect(textNode.isAttached()).toBe(true);
        expect(paragraphNode.isAttached()).toBe(true);
      });
      expect(() => textNode.isAttached()).toThrow();
    });

    test('OutlineNode.isSelected()', async () => {
      const {editor} = testEnv;
      let node;
      await editor.update(() => {
        node = new OutlineNode('__custom_key__');
      });
      await editor.getEditorState().read(() => {
        expect(node.isSelected()).toBe(false);
        expect(textNode.isSelected()).toBe(false);
        expect(paragraphNode.isSelected()).toBe(false);
      });
      await editor.update(() => {
        textNode.select(0, 0);
      });
      await editor.getEditorState().read(() => {
        expect(textNode.isSelected()).toBe(true);
      });
      expect(() => textNode.isSelected()).toThrow();
    });

    test('OutlineNode.isSelected(): selected text node', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(paragraphNode.isSelected()).toBe(false);
        expect(textNode.isSelected()).toBe(false);
      });

      await editor.update(() => {
        textNode.select(0, 0);
      });

      await editor.getEditorState().read(() => {
        expect(textNode.isSelected()).toBe(true);
        expect(paragraphNode.isSelected()).toBe(false);
      });
    });

    test('OutlineNode.isSelected(): selected block node range', async () => {
      const {editor} = testEnv;
      let newParagraphNode;
      let newTextNode;

      await editor.update(() => {
        expect(paragraphNode.isSelected()).toBe(false);
        expect(textNode.isSelected()).toBe(false);

        newParagraphNode = new ParagraphNode();
        newTextNode = new TextNode('bar');
        newParagraphNode.append(newTextNode);
        paragraphNode.insertAfter(newParagraphNode);

        expect(newParagraphNode.isSelected()).toBe(false);
        expect(newTextNode.isSelected()).toBe(false);
      });

      await editor.update(() => {
        textNode.select(0, 0);

        const selection = getSelection();
        expect(selection).not.toBe(null);

        selection.anchor.type = 'text';
        selection.anchor.offset = 1;
        selection.anchor.key = textNode.getKey();

        selection.focus.type = 'text';
        selection.focus.offset = 1;
        selection.focus.key = newTextNode.getKey();
      });

      await Promise.resolve().then();

      await editor.update(() => {
        const selection = getSelection();

        expect(selection.anchor.key).toBe(textNode.getKey());
        expect(selection.focus.key).toBe(newTextNode.getKey());
        expect(paragraphNode.isSelected()).toBe(true);
        expect(textNode.isSelected()).toBe(true);
        expect(newParagraphNode.isSelected()).toBe(true);
        expect(newTextNode.isSelected()).toBe(true);
      });
    });

    test('OutlineNode.getFlags()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(textNode.getFlags()).toEqual(textNode.getLatest().__flags);
      });
      expect(() => textNode.getFlags()).toThrow();
    });

    test('OutlineNode.getKey()', async () => {
      expect(textNode.getKey()).toEqual(textNode.__key);
    });

    test('OutlineNode.getParent()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(node.getParent()).toBe(null);
      });
      await editor.getEditorState().read(() => {
        const rootNode = getRoot();
        expect(textNode.getParent()).toBe(paragraphNode);
        expect(paragraphNode.getParent()).toBe(rootNode);
      });
      expect(() => textNode.getParent()).toThrow();
    });

    test('OutlineNode.getParentOrThrow()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(() => node.getParentOrThrow()).toThrow();
      });
      await editor.getEditorState().read(() => {
        const rootNode = getRoot();
        expect(textNode.getParent()).toBe(paragraphNode);
        expect(paragraphNode.getParent()).toBe(rootNode);
      });
      expect(() => textNode.getParentOrThrow()).toThrow();
    });

    test('OutlineNode.getTopLevelElement()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(node.getTopLevelElement()).toBe(null);
      });
      await editor.getEditorState().read(() => {
        expect(textNode.getTopLevelElement()).toBe(paragraphNode);
        expect(paragraphNode.getTopLevelElement()).toBe(paragraphNode);
      });
      expect(() => textNode.getTopLevelElement()).toThrow();
    });

    test('OutlineNode.getTopLevelElementOrThrow()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(() => node.getTopLevelElementOrThrow()).toThrow();
      });
      await editor.getEditorState().read(() => {
        expect(textNode.getTopLevelElementOrThrow()).toBe(paragraphNode);
        expect(paragraphNode.getTopLevelElementOrThrow()).toBe(paragraphNode);
      });
      expect(() => textNode.getTopLevelElementOrThrow()).toThrow();
    });

    test('OutlineNode.getParents()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(node.getParents()).toEqual([]);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        const rootNode = getRoot();
        expect(textNode.getParents()).toEqual([paragraphNode, rootNode]);
        expect(paragraphNode.getParents()).toEqual([rootNode]);
      });
      expect(() => textNode.getParents()).toThrow();
    });

    test('OutlineNode.getPreviousSibling()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      await editor.update(() => {
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        paragraphNode.append(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(barTextNode.getPreviousSibling()).toEqual(textNode);
        expect(textNode.getPreviousSibling()).toEqual(null);
      });
      expect(() => textNode.getPreviousSibling()).toThrow();
    });

    test('OutlineNode.getPreviousSiblings()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      let bazTextNode;
      await editor.update(() => {
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        bazTextNode = new TextNode('baz');
        bazTextNode.toggleUnmergeable();
        paragraphNode.append(barTextNode, bazTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span><span data-outline-text="true">baz</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(bazTextNode.getPreviousSiblings()).toEqual([
          textNode,
          barTextNode,
        ]);
        expect(barTextNode.getPreviousSiblings()).toEqual([textNode]);
        expect(textNode.getPreviousSiblings()).toEqual([]);
      });
      expect(() => textNode.getPreviousSiblings()).toThrow();
    });

    test('OutlineNode.getNextSibling()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      await editor.update(() => {
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        paragraphNode.append(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(barTextNode.getNextSibling()).toEqual(null);
        expect(textNode.getNextSibling()).toEqual(barTextNode);
      });
      expect(() => textNode.getNextSibling()).toThrow();
    });

    test('OutlineNode.getNextSiblings()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      let bazTextNode;
      await editor.update(() => {
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        bazTextNode = new TextNode('baz');
        bazTextNode.toggleUnmergeable();
        paragraphNode.append(barTextNode, bazTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span><span data-outline-text="true">baz</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(bazTextNode.getNextSiblings()).toEqual([]);
        expect(barTextNode.getNextSiblings()).toEqual([bazTextNode]);
        expect(textNode.getNextSiblings()).toEqual([barTextNode, bazTextNode]);
      });
      expect(() => textNode.getNextSiblings()).toThrow();
    });

    test('OutlineNode.getCommonAncestor()', async () => {
      const {editor} = testEnv;
      let quxTextNode;
      let barParagraphNode;
      let barTextNode;
      let bazParagraphNode;
      let bazTextNode;
      await editor.update(() => {
        const rootNode = getRoot();
        barParagraphNode = new ParagraphNode();
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        bazParagraphNode = new ParagraphNode();
        bazTextNode = new TextNode('baz');
        bazTextNode.toggleUnmergeable();
        quxTextNode = new TextNode('qux');
        quxTextNode.toggleUnmergeable();
        paragraphNode.append(quxTextNode);
        expect(barTextNode.getCommonAncestor(bazTextNode)).toBe(null);
        barParagraphNode.append(barTextNode);
        bazParagraphNode.append(bazTextNode);
        expect(barTextNode.getCommonAncestor(bazTextNode)).toBe(null);
        rootNode.append(barParagraphNode, bazParagraphNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">qux</span></p><p dir="ltr"><span data-outline-text="true">bar</span></p><p dir="ltr"><span data-outline-text="true">baz</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        const rootNode = getRoot();
        expect(textNode.getCommonAncestor(rootNode)).toBe(rootNode);
        expect(quxTextNode.getCommonAncestor(rootNode)).toBe(rootNode);
        expect(barTextNode.getCommonAncestor(rootNode)).toBe(rootNode);
        expect(bazTextNode.getCommonAncestor(rootNode)).toBe(rootNode);
        expect(textNode.getCommonAncestor(quxTextNode)).toBe(
          paragraphNode.getLatest(),
        );
        expect(barTextNode.getCommonAncestor(bazTextNode)).toBe(rootNode);
        expect(barTextNode.getCommonAncestor(bazTextNode)).toBe(rootNode);
      });
      expect(() => textNode.getCommonAncestor(barTextNode)).toThrow();
    });

    test('OutlineNode.isBefore()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      let bazTextNode;
      await editor.update(() => {
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        bazTextNode = new TextNode('baz');
        bazTextNode.toggleUnmergeable();
        paragraphNode.append(barTextNode, bazTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span><span data-outline-text="true">baz</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(textNode.isBefore(textNode)).toBe(false);
        expect(textNode.isBefore(barTextNode)).toBe(true);
        expect(textNode.isBefore(bazTextNode)).toBe(true);
        expect(barTextNode.isBefore(bazTextNode)).toBe(true);
        expect(bazTextNode.isBefore(barTextNode)).toBe(false);
        expect(bazTextNode.isBefore(textNode)).toBe(false);
      });
      expect(() => textNode.isBefore(barTextNode)).toThrow();
    });

    test('OutlineNode.isParentOf()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        const rootNode = getRoot();
        expect(rootNode.isParentOf(textNode)).toBe(true);
        expect(rootNode.isParentOf(paragraphNode)).toBe(true);
        expect(paragraphNode.isParentOf(textNode)).toBe(true);
        expect(paragraphNode.isParentOf(rootNode)).toBe(false);
        expect(textNode.isParentOf(paragraphNode)).toBe(false);
        expect(textNode.isParentOf(rootNode)).toBe(false);
      });
      expect(() => paragraphNode.isParentOf(textNode)).toThrow();
    });

    test('OutlineNode.getNodesBetween()', async () => {
      const {editor} = testEnv;
      let barTextNode;
      let bazTextNode;
      let newParagraphNode;
      let quxTextNode;
      await editor.update(() => {
        const rootNode = getRoot();
        barTextNode = new TextNode('bar');
        barTextNode.toggleUnmergeable();
        bazTextNode = new TextNode('baz');
        bazTextNode.toggleUnmergeable();
        newParagraphNode = new ParagraphNode();
        quxTextNode = new TextNode('qux');
        quxTextNode.toggleUnmergeable();
        rootNode.append(newParagraphNode);
        paragraphNode.append(barTextNode, bazTextNode);
        newParagraphNode.append(quxTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span><span data-outline-text="true">baz</span></p><p dir="ltr"><span data-outline-text="true">qux</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(textNode.getNodesBetween(textNode)).toEqual([textNode]);
        expect(textNode.getNodesBetween(barTextNode)).toEqual([
          textNode,
          barTextNode,
        ]);
        expect(textNode.getNodesBetween(bazTextNode)).toEqual([
          textNode,
          barTextNode,
          bazTextNode,
        ]);
        expect(textNode.getNodesBetween(quxTextNode)).toEqual([
          textNode,
          barTextNode,
          bazTextNode,
          paragraphNode.getLatest(),
          newParagraphNode,
          quxTextNode,
        ]);
      });
      expect(() => textNode.getNodesBetween(bazTextNode)).toThrow();
    });

    test('OutlineNode.isImmutable()', async () => {
      const {editor} = testEnv;
      let immutableTextNode;
      await editor.update(() => {
        immutableTextNode = new TextNode('immutable').makeImmutable();
        paragraphNode.append(immutableTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">immutable</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(textNode.isImmutable(textNode)).toBe(false);
        expect(textNode.getFlags() & IS_IMMUTABLE).toBe(0);
        expect(immutableTextNode.isImmutable()).toBe(true);
        expect(immutableTextNode.getFlags() & IS_IMMUTABLE).toBe(IS_IMMUTABLE);
      });
      expect(() => textNode.isImmutable()).toThrow();
    });

    test('OutlineNode.isSegmented()', async () => {
      const {editor} = testEnv;
      let segmentedTextNode;
      await editor.update(() => {
        segmentedTextNode = new TextNode('segmented').makeSegmented();
        paragraphNode.append(segmentedTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">segmented</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(textNode.isSegmented(textNode)).toBe(false);
        expect(textNode.getFlags() & IS_SEGMENTED).toBe(0);
        expect(segmentedTextNode.isSegmented()).toBe(true);
        expect(segmentedTextNode.getFlags() & IS_SEGMENTED).toBe(IS_SEGMENTED);
      });
      expect(() => textNode.isSegmented()).toThrow();
    });

    test('OutlineNode.isInert()', async () => {
      const {editor} = testEnv;
      let inertTextNode;
      await editor.update(() => {
        inertTextNode = new TextNode('inert').makeInert();
        paragraphNode.append(inertTextNode);
      });
      await editor.getEditorState().read(() => {
        expect(textNode.isInert(textNode)).toBe(false);
        expect(textNode.getFlags() & IS_INERT).toBe(0);
        expect(inertTextNode.isInert()).toBe(true);
        expect(inertTextNode.getFlags() & IS_INERT).toBe(IS_INERT);
      });
      expect(() => textNode.isInert()).toThrow();
    });

    test('OutlineNode.isDirectionless()', async () => {
      const {editor} = testEnv;
      let directionlessTextNode;
      await editor.update(() => {
        directionlessTextNode = new TextNode(
          'directionless',
        ).makeDirectionless();
        paragraphNode.append(directionlessTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">directionless</span></p></div>',
      );
      await editor.getEditorState().read(() => {
        expect(textNode.isDirectionless(textNode)).toBe(false);
        expect(textNode.getFlags() & IS_DIRECTIONLESS).toBe(0);
        expect(directionlessTextNode.isDirectionless()).toBe(true);
        expect(directionlessTextNode.getFlags() & IS_DIRECTIONLESS).toBe(
          IS_DIRECTIONLESS,
        );
      });
      expect(() => textNode.isDirectionless()).toThrow();
    });

    test('OutlineNode.getLatest()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(textNode.getLatest()).toBe(textNode);
      });
      expect(() => textNode.getLatest()).toThrow();
    });

    test('OutlineNode.getLatest(): garbage collected node', async () => {
      const {editor} = testEnv;
      let node;
      let text;
      let block;
      await editor.update(() => {
        node = new OutlineNode();
        node.getLatest();
        text = new TextNode();
        text.getLatest();
        block = new TestElementNode();
        block.getLatest();
      });
      await editor.update(() => {
        expect(() => node.getLatest()).toThrow();
        expect(() => text.getLatest()).toThrow();
        expect(() => block.getLatest()).toThrow();
      });
    });

    test('OutlineNode.getTextContent()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(node.getTextContent()).toBe('');
      });
      await editor.getEditorState().read(() => {
        expect(textNode.getTextContent()).toBe('foo');
      });
      expect(() => textNode.getTextContent()).toThrow();
    });

    test('OutlineNode.getTextContentSize()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(textNode.getTextContentSize()).toBe('foo'.length);
        // TODO: more tests with inert and directionless children
      });
      expect(() => textNode.getTextContentSize()).toThrow();
    });

    test('OutlineNode.createDOM()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(() => node.createDOM()).toThrow();
      });
    });

    test('OutlineNode.updateDOM()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const node = new OutlineNode();
        expect(() => node.updateDOM()).toThrow();
      });
    });

    test('OutlineNode.setFlags()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.setFlags(IS_SEGMENTED)).toThrow();
      });
      await editor.update(() => {
        expect(textNode.getFlags()).toBe(0);
        textNode.setFlags(IS_SEGMENTED);
        expect(textNode.getFlags()).toBe(IS_SEGMENTED);
        textNode.setFlags(IS_INERT);
        expect(textNode.getFlags()).toBe(IS_INERT);
        textNode.setFlags(0);
        expect(textNode.getFlags()).toBe(0);
        textNode.setFlags(IS_IMMUTABLE);
        expect(textNode.getFlags()).toBe(IS_IMMUTABLE);
        expect(() => textNode.setFlags(IS_SEGMENTED)).toThrow();
        expect(textNode.getFlags()).toBe(IS_IMMUTABLE);
      });
      expect(() => textNode.setFlags()).toThrow();
    });

    test('OutlineNode.makeImmutable()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.makeImmutable()).toThrow();
      });
      await editor.update(() => {
        textNode.makeImmutable();
        expect(textNode.getFlags() & IS_IMMUTABLE).toBe(IS_IMMUTABLE);
      });
      expect(() => textNode.makeImmutable()).toThrow();
    });

    test('OutlineNode.makeSegmented()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.makeSegmented()).toThrow();
      });
      await editor.update(() => {
        textNode.makeSegmented();
        expect(textNode.getFlags() & IS_SEGMENTED).toBe(IS_SEGMENTED);
      });
      expect(() => textNode.makeSegmented()).toThrow();
    });

    test('OutlineNode.makeInert()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.makeInert()).toThrow();
      });
      await editor.update(() => {
        textNode.makeInert();
        expect(textNode.getFlags() & IS_INERT).toBe(IS_INERT);
      });
      expect(() => textNode.makeInert()).toThrow();
    });

    test('OutlineNode.makeDirectionless()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.makeDirectionless()).toThrow();
      });
      await editor.update(() => {
        textNode.makeDirectionless();
        expect(textNode.getFlags() & IS_DIRECTIONLESS).toBe(IS_DIRECTIONLESS);
      });
      expect(() => textNode.makeDirectionless()).toThrow();
    });

    test('OutlineNode.remove()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.remove()).toThrow();
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const node = new OutlineNode();
        node.remove();
        expect(node.getParent()).toBe(null);
        textNode.remove();
        expect(textNode.getParent()).toBe(null);
        expect(editor._dirtyLeaves.has(textNode.getKey()));
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p><br></p></div>',
      );
      expect(() => textNode.remove()).toThrow();
    });

    test('OutlineNode.replace()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.replace()).toThrow();
      });
      expect(() => textNode.remove()).toThrow();
    });

    test('OutlineNode.replace(): from another parent', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      let barTextNode;
      await editor.update(() => {
        const rootNode = getRoot();
        const barParagraphNode = new ParagraphNode();
        barTextNode = new TextNode('bar');
        barParagraphNode.append(barTextNode);
        rootNode.append(barParagraphNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p><p dir="ltr"><span data-outline-text="true">bar</span></p></div>',
      );
      await editor.update(() => {
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span></p><p dir="ltr"><br></p></div>',
      );
    });

    test('OutlineNode.replace(): text', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar');
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.replace(): immutable', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeImmutable();
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.replace(): inert', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeInert();
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p><span data-outline-text="true" style="pointer-events: none; user-select: none;">bar</span></p></div>',
      );
    });

    test('OutlineNode.replace(): segmented', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeSegmented();
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.replace(): directionless', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode(`bar`).makeDirectionless();
        textNode.replace(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p><span data-outline-text="true">bar</span></p></div>',
      );
      // TODO: add text direction validations
    });

    test('OutlineNode.insertAfter()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.insertAfter()).toThrow();
      });
      expect(() => textNode.insertAfter()).toThrow();
    });

    test('OutlineNode.insertAfter(): text', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar');
        textNode.insertAfter(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foobar</span></p></div>',
      );
    });

    test('OutlineNode.insertAfter(): immutable', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeImmutable();
        textNode.insertAfter(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.insertAfter(): segmented', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeSegmented();
        textNode.insertAfter(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.insertAfter(): inert', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeInert();
        textNode.insertAfter(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true" style="pointer-events: none; user-select: none;">bar</span></p></div>',
      );
    });

    test('OutlineNode.insertAfter(): directionless', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode(`bar`).makeDirectionless();
        textNode.insertAfter(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span><span data-outline-text="true">bar</span></p></div>',
      );
      // TODO: add text direction validations
    });

    test('OutlineNode.insertAfter() move blocks around', async () => {
      const {editor} = testEnv;
      let block1, block2, block3, text1, text2, text3;
      await editor.update(() => {
        const root = getRoot();
        root.clear();
        block1 = new ParagraphNode();
        block2 = new ParagraphNode();
        block3 = new ParagraphNode();
        text1 = new TextNode('A');
        text2 = new TextNode('B');
        text3 = new TextNode('C');
        block1.append(text1);
        block2.append(text2);
        block3.append(text3);
        root.append(block1, block2, block3);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">A</span></p><p dir="ltr"><span data-outline-text="true">B</span></p><p dir="ltr"><span data-outline-text="true">C</span></p></div>',
      );
      await editor.update((state) => {
        text1.insertAfter(block2);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">A</span><p dir="ltr"><span data-outline-text="true">B</span></p></p><p dir="ltr"><span data-outline-text="true">C</span></p></div>',
      );
    });

    test('OutlineNode.insertAfter() move blocks around #2', async () => {
      const {editor} = testEnv;
      let block1, block2, block3, text1, text2, text3;
      await editor.update(() => {
        const root = getRoot();
        root.clear();
        block1 = new ParagraphNode();
        block2 = new ParagraphNode();
        block3 = new ParagraphNode();
        text1 = new TextNode('A');
        text1.toggleUnmergeable();
        text2 = new TextNode('B');
        text2.toggleUnmergeable();
        text3 = new TextNode('C');
        text3.toggleUnmergeable();
        block1.append(text1);
        block2.append(text2);
        block3.append(text3);
        root.append(block1);
        root.append(block2);
        root.append(block3);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">A</span></p><p dir="ltr"><span data-outline-text="true">B</span></p><p dir="ltr"><span data-outline-text="true">C</span></p></div>',
      );
      await editor.update(() => {
        text3.insertAfter(text1);
        text3.insertAfter(text2);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p><br></p><p><br></p><p dir="ltr"><span data-outline-text="true">C</span><span data-outline-text="true">B</span><span data-outline-text="true">A</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore()', async () => {
      const {editor} = testEnv;
      await editor.getEditorState().read(() => {
        expect(() => textNode.insertBefore()).toThrow();
      });
      expect(() => textNode.insertBefore()).toThrow();
    });

    test('OutlineNode.insertBefore(): from another parent', async () => {
      const {editor} = testEnv;

      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );

      let barTextNode;
      await editor.update(() => {
        const rootNode = getRoot();
        const barParagraphNode = new ParagraphNode();
        barTextNode = new TextNode('bar');
        barParagraphNode.append(barTextNode);
        rootNode.append(barParagraphNode);
      });

      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p><p dir="ltr"><span data-outline-text="true">bar</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore(): text', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar');
        textNode.insertBefore(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">barfoo</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore(): immutable', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeImmutable();
        textNode.insertBefore(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span><span data-outline-text="true">foo</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore(): segmented', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeSegmented();
        textNode.insertBefore(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span><span data-outline-text="true">foo</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore(): inert', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode('bar').makeInert();
        textNode.insertBefore(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true" style="pointer-events: none; user-select: none;">bar</span><span data-outline-text="true">foo</span></p></div>',
      );
    });

    test('OutlineNode.insertBefore(): directionless', async () => {
      const {editor} = testEnv;
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">foo</span></p></div>',
      );
      await editor.update(() => {
        const barTextNode = new TextNode(`bar`).makeDirectionless();
        textNode.insertBefore(barTextNode);
      });
      expect(testEnv.outerHTML).toBe(
        '<div contenteditable="true" data-outline-editor="true"><p dir="ltr"><span data-outline-text="true">bar</span><span data-outline-text="true">foo</span></p></div>',
      );
      // TODO: add text direction validations
    });

    test('OutlineNode.selectNext()', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const barTextNode = new TextNode('bar');
        textNode.insertAfter(barTextNode);
        expect(barTextNode.isSelected()).not.toBe(true);
        textNode.selectNext();
        expect(barTextNode.isSelected()).toBe(true);
        // TODO: additional validation of anchorOffset and focusOffset
      });
    });

    test('OutlineNode.selectNext(): no next sibling', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const selection = textNode.selectNext();
        expect(selection.anchor.getNode()).toBe(paragraphNode);
        expect(selection.anchor.offset).toBe(1);
      });
    });

    test('OutlineNode.selectNext(): non-text node', async () => {
      const {editor} = testEnv;
      await editor.update(() => {
        const barNode = new TestNode();
        textNode.insertAfter(barNode);
        const selection = textNode.selectNext();
        expect(selection.anchor.getNode()).toBe(textNode.getParent());
        expect(selection.anchor.offset).toBe(1);
      });
    });
  });
});
