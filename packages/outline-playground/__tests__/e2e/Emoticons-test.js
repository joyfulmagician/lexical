/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {initializeE2E, assertHTML, assertSelection, repeat} from '../utils';

describe('Emoticons', () => {
  initializeE2E((e2e) => {
    it(`Can handle a single emoticon`, async () => {
      const {page} = e2e;

      await page.focus('div.editor');
      await page.keyboard.type('This is an emoji :)');
      await assertHTML(
        page,
        '<p class="editor-paragraph" dir="ltr"><span data-outline-text="true">This is an emoji </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"></span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 1, 0],
        anchorOffset: 2,
        focusPath: [0, 1, 0],
        focusOffset: 2,
      });

      await page.keyboard.press('Backspace');
      await assertHTML(
        page,
        '<p class="editor-paragraph" dir="ltr"><span data-outline-text="true">This is an emoji </span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 0, 0],
        anchorOffset: 17,
        focusPath: [0, 0, 0],
        focusOffset: 17,
      });

      await page.keyboard.type(':)');
      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 0, 0],
        anchorOffset: 17,
        focusPath: [0, 0, 0],
        focusOffset: 17,
      });

      await page.keyboard.press('ArrowRight');
      await assertSelection(page, {
        anchorPath: [0, 1, 0],
        anchorOffset: 2,
        focusPath: [0, 1, 0],
        focusOffset: 2,
      });

      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Delete');
      await assertHTML(
        page,
        '<p class="editor-paragraph" dir="ltr"><span data-outline-text="true">This is an emoji </span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 0, 0],
        anchorOffset: 17,
        focusPath: [0, 0, 0],
        focusOffset: 17,
      });
    });

    it(`Can enter mutliple emoticons`, async () => {
      const {isRichText, page} = e2e;

      await page.focus('div.editor');
      await page.keyboard.type(':) :) <3 :(');
      await assertHTML(
        page,
        '<p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 7, 0],
        anchorOffset: 2,
        focusPath: [0, 7, 0],
        focusOffset: 2,
      });

      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await assertHTML(
        page,
        '<p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span><br><span data-outline-text="true"></span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 10, 0],
        anchorOffset: 0,
        focusPath: [0, 10, 0],
        focusOffset: 0,
      });

      await page.keyboard.type(':) :) <3 :(');
      await assertHTML(
        page,
        '<p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span><br><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span></p>',
      );
      await assertSelection(page, {
        anchorPath: [0, 17, 0],
        anchorOffset: 2,
        focusPath: [0, 17, 0],
        focusOffset: 2,
      });

      await page.keyboard.press('Enter');
      if (isRichText) {
        await assertHTML(
          page,
          '<p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span><br><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span></p><p class="editor-paragraph"><span data-outline-text="true"></span></p>',
        );
        await assertSelection(page, {
          anchorPath: [1, 0, 0],
          anchorOffset: 0,
          focusPath: [1, 0, 0],
          focusOffset: 0,
        });
      } else {
        await assertHTML(
          page,
          '<p class="editor-paragraph"><span data-outline-text="true">​</span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true">​ </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true">​</span><br><span data-outline-text="true">​</span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true">​ </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true">​</span><br><span data-outline-text="true">​</span></p>',
        );
        await assertSelection(page, {
          anchorPath: [0, 20, 0],
          anchorOffset: 0,
          focusPath: [0, 20, 0],
          focusOffset: 0,
        });
      }

      await page.keyboard.type(':) :) <3 :(');
      if (isRichText) {
        await assertHTML(
          page,
          '<p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span><br><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span></p><p class="editor-paragraph"><span data-outline-text="true"></span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true"> </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true"> </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true"></span></p>',
        );
        await assertSelection(page, {
          anchorPath: [1, 7, 0],
          anchorOffset: 2,
          focusPath: [1, 7, 0],
          focusOffset: 2,
        });
      } else {
        await assertHTML(
          page,
          '<p class="editor-paragraph"><span data-outline-text="true">​</span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true">​ </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true">​</span><br><span data-outline-text="true">​</span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true">​ </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true">​</span><br><span data-outline-text="true">​</span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji happysmile" data-outline-text="true">🙂</span><span data-outline-text="true">​ </span><span class="emoji heart" data-outline-text="true">❤</span><span data-outline-text="true">​ </span><span class="emoji unhappysmile" data-outline-text="true">🙁</span><span data-outline-text="true">​</span></p>',
        );
        await assertSelection(page, {
          anchorPath: [0, 27, 0],
          anchorOffset: 2,
          focusPath: [0, 27, 0],
          focusOffset: 2,
        });
      }

      await repeat(23, async () => await page.keyboard.press('Backspace'));
      await assertHTML(
        page,
        '<p class="editor-paragraph"><span data-outline-text="true"><br></span></p><div class="editor-placeholder">Enter some rich text...</div>',
      );
      await assertSelection(page, {
        anchorPath: [0, 0, 0],
        anchorOffset: 0,
        focusPath: [0, 0, 0],
        focusOffset: 0,
      });

      await page.keyboard.type(':):):):):)');
      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 8, 0],
        anchorOffset: 0,
        focusPath: [0, 8, 0],
        focusOffset: 0,
      });

      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 6, 0],
        anchorOffset: 0,
        focusPath: [0, 6, 0],
        focusOffset: 0,
      });

      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 4, 0],
        anchorOffset: 0,
        focusPath: [0, 4, 0],
        focusOffset: 0,
      });

      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 2, 0],
        anchorOffset: 0,
        focusPath: [0, 2, 0],
        focusOffset: 0,
      });

      await page.keyboard.press('ArrowLeft');
      await assertSelection(page, {
        anchorPath: [0, 0, 0],
        anchorOffset: 0,
        focusPath: [0, 0, 0],
        focusOffset: 0,
      });
    });
  });
});
