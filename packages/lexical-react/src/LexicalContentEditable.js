/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import * as React from 'react';
import {useCallback} from 'react';

export type Props = $ReadOnly<{
  ariaActiveDescendantID?: string,
  ariaAutoComplete?: string,
  ariaControls?: string,
  ariaDescribedBy?: string,
  ariaExpanded?: boolean,
  ariaLabel?: string,
  ariaLabelledBy?: string,
  ariaMultiline?: boolean,
  ariaOwneeID?: string,
  ariaRequired?: string,
  autoCapitalize?: boolean,
  autoComplete?: boolean,
  autoCorrect?: boolean,
  className?: string,
  readOnly?: boolean,
  role?: string,
  spellCheck?: boolean,
  style?: StyleSheetList,
  tabIndex?: number,
  testid?: string,
}>;

export default function LexicalContentEditable({
  ariaActiveDescendantID,
  ariaAutoComplete,
  ariaControls,
  ariaDescribedBy,
  ariaExpanded,
  ariaLabel,
  ariaLabelledBy,
  ariaMultiline,
  ariaOwneeID,
  ariaRequired,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  className,
  readOnly = false,
  role = 'textbox',
  spellCheck = true,
  style,
  tabIndex,
  testid,
}: Props): React.MixedElement {
  const [editor] = useLexicalComposerContext();
  const ref = useCallback(
    (rootElement: null | HTMLElement) => {
      editor.setRootElement(rootElement);
    },
    [editor],
  );

  return (
    <div
      aria-activedescendant={readOnly ? null : ariaActiveDescendantID}
      aria-autocomplete={readOnly ? null : ariaAutoComplete}
      aria-controls={readOnly ? null : ariaControls}
      aria-describedby={ariaDescribedBy}
      aria-expanded={
        readOnly ? null : role === 'combobox' ? !!ariaExpanded : null
      }
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiline={ariaMultiline}
      aria-owns={readOnly ? null : ariaOwneeID}
      aria-required={ariaRequired}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      autoCorrect={autoCorrect}
      className={className}
      contentEditable={!readOnly}
      data-testid={testid}
      ref={ref}
      role={readOnly ? null : role}
      spellCheck={spellCheck}
      style={style}
      tabIndex={tabIndex}
    />
  );
}
