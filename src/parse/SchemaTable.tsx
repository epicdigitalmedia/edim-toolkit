import Parse from 'parse/dist/parse.min.js';
import React, { useEffect, useState, useMemo } from 'react';

import {
  ClassTable,
  ClassTableProps,
} from "./ClassTable";

import {
  EditableDateCell,
  EditableCell,
  EditableAttributeCell,
  EditableNumberCell,
  EditableRelationCell,
  EditableBooleanCell,
} from './ClassTableFields';

import { HamburgerIcon, SettingsIcon } from '@chakra-ui/icons';

import { IoEyeSharp, IoEyeOffSharp } from 'react-icons/io5'

import { useQuery } from '@tanstack/react-query';

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalCloseButton,
  ModalProps,
  useDisclosure,
  Flex,
  Input,
  IconButton,
  Button
} from '@chakra-ui/react';

import Selector from '../components/Selectors/Selector';
import DraggableList from '@epicdm/toolkit/src/components/Draggable/DraggableList'
import { SchemaConfig, AttributeAttributes } from '@app/shared/parse-types';
import getters from '@app/shared/utils/getters';
import { DeleteButton } from '../components/Buttons/DeleteButton';
import { useHistory } from 'react-router-dom';

const CellRenderMap = {
  "Date": EditableDateCell,
  "Boolean": EditableBooleanCell,
  "Number": EditableNumberCell,
  "String": EditableCell,
  "Object": EditableCell,
  "ACL": EditableCell,
  "Pointer": EditableRelationCell,
  "Relation": EditableRelationCell,
}

const locked = [
  'createdAt',
  'updatedAt',
  'ACL',
  'objectId',
  'e_id',
];

interface ClassSchema {
  className: string;
  fields: { [key: string]: { type: string; } };
}

interface SchemaSettingsModalProps extends Partial<ModalProps> {
  schema: ClassSchema;
  config: SchemaConfig;
  onColumnOrderChange: (columnOrder: string[]) => void;
  refetch?: () => void;
}

const SchemaPropOptions = ({ prop, config, refetch }) => {
  const columnWidths = config?.get('columnWidths') || {};
  const columnVisibility = config?.get('columnVisibility') || {};
  const [width, setWidth] = useState(columnWidths[prop] || 200);
  const [visibility, setVisibility] = useState(columnVisibility[prop] !== false);

  const handleUpdate = (event) => {
    const { value } = event.target;
    const val = parseInt(value, 10);
    setWidth((!isNaN(val)) ? val : 200);
  }

  const handleBlur = () => {
    config.set('columnWidths', {
      ...columnWidths,
      [prop]: width,
    })
    config.save()
      .then(() => {
        if (refetch) refetch();
      }).catch((err) => {
        console.log(err);
      });;
  }

  const toggleVisible = () => {
    const newVisibility = !visibility;
    config.set('columnVisibility', {
      ...columnVisibility,
      [prop]: newVisibility,
    });
    setVisibility(newVisibility);
    config.save()
      .then(() => {
        if (refetch) refetch();
      }).catch((err) => {
        console.log(err);
      });
  }

  return (
    <Flex direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
      <HamburgerIcon mr={3} />
      {prop}
      <Input
        value={width}
        width={'100px'}
        onChange={handleUpdate}
        onBlur={handleBlur}
        type="number"
      />
      <IconButton
        aria-label='Toggle visibility'
        icon={visibility ? <IoEyeSharp /> : <IoEyeOffSharp />}
        onClick={toggleVisible}
      />
    </Flex>
  )
}

const SchemaSettingsModal: React.FC<SchemaSettingsModalProps> = ({ schema, config, isOpen, onClose, onColumnOrderChange, refetch }) => {
  const fields: string[] = Object.keys(schema.fields);
  const columnOrder = config?.get('columnOrder') || [];
  const items = fields.reduce((acc, val) => {
    if (acc.indexOf(val) === -1) {
      acc[columnOrder.indexOf(val)] = val;
    }
    return acc;
  }, columnOrder as string[]);
  return (
    <Modal blockScrollOnMount={false} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{`${schema.className} Table Options`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {config && (
            <DraggableList
              items={items}
              onColumnOrderChange={onColumnOrderChange}
              renderItem={(item) => (
                <SchemaPropOptions prop={item} config={config} refetch={refetch} />
              )}
            />
          )}
        </ModalBody>
        {/* <ModalFooter>
          <Button colorScheme='blue' mr={3} onClick={onClose}>
            Close
          </Button>
          <Button variant='ghost'>Secondary Action</Button>
        </ModalFooter> */}
      </ModalContent>
    </Modal>
  )
}

export interface SchemaTableProps extends ClassTableProps {
  objectClass: string;
  handleCreateNew: ({ refetch }: { refetch: any }) => () => Promise<any>;
  columnRenderMap?: { [key: string]: React.FC<any> };
  query?: any;
  queryKey?: any[];
}

export const SchemaTable: React.FC<SchemaTableProps> = ({ query, queryKey, handleCreateNew, objectClass, columnRenderMap }) => {
  const history = useHistory();
  const [selectedSchema, setSelectedSchema] = useState<any>();
  const { isOpen, onOpen, onClose } = useDisclosure()

  const getClassSchemas = async () => {
    const classSchema = await Parse.Cloud.run('getClassSchemas');
    return classSchema;
  }

  const getClassSchemaConfig = async () => {
    const SchemaConfigClass = Parse.Object.extend('SchemaConfig');
    const query = new Parse.Query(SchemaConfigClass);
    query.equalTo('schema', selectedSchema.className);
    const config = await query.first();
    if (!config) {
      return new SchemaConfigClass({
        schema: selectedSchema.className,
        columnOrder: Object.keys(selectedSchema.fields),
        columnWidths: {},
        columnVisibility: {},
      });
    }
    return config;
  }

  const ClassSchemaOptionsRequest = useQuery(
    ['ClassSchemaConfig', selectedSchema && selectedSchema.className],
    () => getClassSchemaConfig(),
    {
      enabled: !!selectedSchema,
    }
  );

  const classSchemaConfig = ClassSchemaOptionsRequest.data;

  const setColumnOrder = (columnOrder: string[]) => {
    if (classSchemaConfig) {
      classSchemaConfig.set('columnOrder', columnOrder);
      classSchemaConfig.save().then(() => {
        ClassSchemaOptionsRequest.refetch();
      });
    }
  }

  const ClassSchemaRequest = useQuery(
    ['ClassSchemas'],
    () => getClassSchemas(),
  );

  useEffect(() => {
    if (ClassSchemaRequest.data) {
      const selected = (objectClass)
        ? ClassSchemaRequest.data.find((schema) => schema.className === objectClass)
        : ClassSchemaRequest.data[0];
      setSelectedSchema(selected);
    }
  }, [ClassSchemaRequest.data]);

  const handleSchemaChange = (className: string) => {
    const schema = ClassSchemaRequest.data.find(schema => schema.className === className);
    setSelectedSchema(schema);
  }

  const columns = useMemo(() => {
    if (!selectedSchema) return [];
    const cols = Object.keys(selectedSchema.fields)
      .filter((field) => {
        const visibility = classSchemaConfig?.get('columnVisibility') || [];
        return visibility[field] !== false;
      })
      .map((field) => {
        const f = selectedSchema.fields[field];
        let CellRender = CellRenderMap[f.type] || EditableCell;

        if (f.type === 'Pointer' && f.targetClass.indexOf('Attribute') > -1) {
          CellRender = EditableAttributeCell({
            attributeName: field,
            objectClass: f.targetClass,
            valueGetter: (row: AttributeAttributes) => row.objectId,
            labelGetter: (row: AttributeAttributes) => row.value,
          });
        } else if (f.type === 'Pointer') {
          CellRender = EditableRelationCell({
            objectClass: f.targetClass,
            ...getters(f.targetClass),
            isClearable: true,
          });
        } else if (f.type === 'Relation' && f.targetClass.indexOf('Attribute') > -1) {
          console.log(f);
          CellRender = EditableAttributeCell({
            attributeName: field,
            objectClass: f.targetClass,
            valueGetter: (row: AttributeAttributes) => row.objectId,
            labelGetter: (row: AttributeAttributes) => row.value,
            isClearable: true,
            isMulti: true,
          });
        }

        const columnWidths = classSchemaConfig?.get('columnWidths') || {};

        if (columnRenderMap && columnRenderMap[field]) {
          CellRender = columnRenderMap[field];
        }

        return {
          Header: field,
          accessor: field,
          width: columnWidths[field] || 200,
          editable: !locked.includes(field),
          Cell: CellRender,
        };
      }).reduce((acc, val) => {
        const sortOrder = classSchemaConfig?.get('columnOrder') || [];
        if (sortOrder.length > 0 && sortOrder.indexOf(val.accessor) !== -1) {
          acc[sortOrder.indexOf(val.accessor)] = val;
          return acc;
        }
        return [...acc, val];
      }, []).filter((col) => !!col);

    console.log(cols)

    cols.push({
      Header: 'Actions',
      accessor: 'actions',
      width: 300,
      Cell: ({ row, column }) => {
        const getter = getters(objectClass);
        console.log(getter.detailPath)
        return (
          <Flex direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
            <Button onClick={() => history.push(`/admin/${getter && getter.detailPath || objectClass.toLowerCase()}/${row.original._object.id}`)}>
              Detail
            </Button>
            <DeleteButton object={row.original._object} />
          </Flex>
        )
      }
    });

    return cols;
  }, [selectedSchema, classSchemaConfig]);

  const schemaOptions = useMemo(() => {
    if (!ClassSchemaRequest.data) return [];
    return ClassSchemaRequest.data.map((schema) => {
      return {
        value: schema.className,
        label: schema.className,
      }
    })
  }, [ClassSchemaRequest]);

  if (!selectedSchema) return null;

  const splitTitleCase = (str: string) => {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }

  return (
    <>
      <ClassTable
        isAdmin
        objectClass={selectedSchema.className}
        title={splitTitleCase(selectedSchema.className)}
        query={query}
        queryKey={queryKey}
        showFilters
        findAll
        columnsData={columns}
        onColumnOrderChange={setColumnOrder}
        handleCreateNew={handleCreateNew}
        renderFilters={() => (
          <>
            {!objectClass && (
              <Selector
                style={{ width: '250px' }}
                label="Schema"
                options={schemaOptions}
                initialValue={selectedSchema && { label: selectedSchema.className, value: selectedSchema.className }}
                onSelect={handleSchemaChange}
              />
            )}
            <IconButton
              aria-label='Open Table Options'
              icon={<SettingsIcon />}
              onClick={onOpen} />
          </>
        )}
      />
      <SchemaSettingsModal
        isOpen={isOpen}
        onClose={onClose}
        schema={selectedSchema}
        config={classSchemaConfig}
        onColumnOrderChange={setColumnOrder}
        refetch={ClassSchemaOptionsRequest.refetch}
      />
    </>
  );
}
