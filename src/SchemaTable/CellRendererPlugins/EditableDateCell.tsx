import React, { } from "react";
import { SingleDatePickerParse } from '../../forms/Fields/DatePickerField';
import DiscussionButton from '../../components/Buttons/DiscussionButton';
import ToggleEditWrapper from "./ToggleEditWrapper";
import { PluginTypes } from '../types';

export const EditableDateCell = ({ cell, row: { original }, column, rowEditable, setRowEditable, }) => {
  const { id, editable, textAlign, discussion, discussionTitle } = column;

  if (!rowEditable) {
    const d = original._object.get(id);
    if (!d) return null;
    return (
      <ToggleEditWrapper
        width={'100%'}
        textAlign={textAlign || 'center'}
        value={d.toLocaleDateString() || null}
        rowEditable={rowEditable}
        setRowEditable={setRowEditable}
        editable={editable}
      />
    )
  }

  return (
    <>
      <SingleDatePickerParse
        property={id}
        object={original._object}
      />
      {discussion && <DiscussionButton
        type='icon'
        object={original._object}
        context={id}
        title={discussionTitle && discussionTitle(original._object)}
      />}
    </>
  )
}

export default {
  name: 'EditableDateCell',
  type: PluginTypes.CellRenderer,
  component: EditableDateCell
}
