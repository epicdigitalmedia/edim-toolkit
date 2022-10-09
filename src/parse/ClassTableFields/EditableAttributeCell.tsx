import Parse from 'parse/dist/parse.min.js';
import React, { useState, useEffect } from "react";
import { ClassNames } from "@app/shared/types";
import { Attribute } from "@app/shared/parse-types";

import ClassSearchSelect from '../../components/Selectors/ClassSearchSelect';
import DiscussionButton from '../../components/Buttons/DiscussionButton';

export interface EditableAttributeCellProps {
  attributeName: string;
  objectClass: ClassNames;
  valueGetter: (data: any) => string;
  labelGetter: (data: any) => string;
  isMulti?: boolean;
  isClearable?: boolean;
}

export const EditableAttributeCell = ({
  attributeName,
  objectClass,
  valueGetter,
  labelGetter,
  isMulti,
  isClearable,
}: EditableAttributeCellProps) => ({
  row: { original },
  column: { id, discussion, discussionTitle, },
}) => {
    const initialValue = original._object.get(id);
    const [initialData, setInitialData] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    useEffect(() => {
      if (isMulti && initialValue) {
        setIsLoading(true);
        initialValue?.query().find()
          .then((result: any) => {
            setIsLoading(false);
            setError(undefined);
            if (result) {
              setInitialData(result.map((r: Parse.Object<any>) => r.toJSON()));
            }
          })
          .catch((err: any) => {
            setIsLoading(false);
            setError(err);
          })
      } else {
        const iv = initialValue?.toJSON();
        if (iv) {
          setInitialData(iv);
        }
      }
    }, [isMulti, initialValue]);

    const handleUpdate = async (value: any) => {
      console.log('handleUpdate', value);
      const object: Attribute = original._object;
      setIsLoading(true);
      if (isMulti) {
        if (value[0] !== undefined) {
          object.relation(id).add(value);
        }
      } else {
        object.set(id, value);
      }
      await object.save();
      setIsLoading(false);
    }

    const handleClear = async () => {
      console.log('handleClear');
      const object = original._object;
      setIsLoading(true);
      if (isMulti) {
        const items = await object.relation(id).query().find();
        items.forEach((item: Attribute) => {
          object.relation(id).remove(item);
        });
      } else {
        object.set(id, null);
      }
      await object.save();
      setIsLoading(false);
      setInitialData(undefined);
    }

    const handleRemove = async (objectId: string) => {
      console.log('handleRemove', objectId);
      const object = original._object;
      setIsLoading(true);
      const options = await object.relation(id).query().find();
      const removed = options.filter((o: Attribute) => o.id === objectId);
      object.relation(id).remove(removed);
      await object.save();
      setIsLoading(false);
    }

    const handleCreate = async (value: string) => {
      console.log({ operation: 'handleCreate', value, isMulti });
      const object = original._object;
      setIsLoading(true);
      const AttributeClass = Parse.Object.extend(objectClass);
      const attribute = new AttributeClass();
      attribute.set('name', id);
      attribute.set('value', value);
      await attribute.save();
      if (isMulti) {
        object.relation(id).add(attribute);
      } else {
        object.set(id, attribute);
      }
      await object.save();

      if (isMulti) {
        const options = await object.relation(id).query().find();
        setInitialData(options.map((r: Parse.Object<any>) => r.toJSON()));
      } else {
        setInitialData(attribute?.toJSON());
      }

      setIsLoading(false);
      return attribute;
    }

    return (
      <>
        <div style={{ width: '90%', zIndex: 1000 }}>
          <ClassSearchSelect
            isClearable={isClearable}
            isLoading={isLoading}
            disabled={isLoading}
            style={{ width: '100%' }}
            objectClass={objectClass}
            initialValue={initialData}
            valueGetter={valueGetter}
            labelGetter={labelGetter}
            onSelect={handleUpdate}
            onCreate={handleCreate}
            onRemove={handleRemove}
            onClear={handleClear}
            isCreateable
            queryName={objectClass}
            isMulti={isMulti}
            filters={[
              {
                prop: 'name',
                method: 'equalTo',
                value: attributeName,
              }
            ]}
          />
        </div>
        {discussion && (
          <DiscussionButton
            type='icon'
            object={original._object}
            property={id}
            title={discussionTitle && discussionTitle(original._object)}
          />
        )}
      </>
    )
  }