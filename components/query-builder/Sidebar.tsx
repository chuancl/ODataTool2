import React from 'react';
import { 
    Select, 
    SelectItem,
    Accordion, 
    AccordionItem,
    CheckboxGroup, 
    Checkbox,
    Input,
    Switch,
    Badge,
    ScrollShadow
} from '@heroui/react';
import { 
    Database, 
    LayoutGrid, 
    Layers, 
    Filter, 
    ArrowUpDown, 
    Hash, 
    Check 
} from 'lucide-react';
import { ODataSchema, ODataEntity } from '../../types';

interface SidebarProps {
    schema: ODataSchema;
    selectedSet: string;
    onSetChange: (val: string) => void;
    currentEntity: ODataEntity | null | undefined;
    selectedProps: Set<string>;
    onPropChange: (set: Set<string>) => void;
    expandProps: Set<string>;
    onExpandChange: (set: Set<string>) => void;
    filter: string;
    onFilterChange: (val: string) => void;
    orderBy: string;
    onOrderByChange: (val: string) => void;
    orderByDir: 'asc' | 'desc';
    onOrderByDirChange: (val: 'asc' | 'desc') => void;
    top: number | '';
    onTopChange: (val: number | '') => void;
    skip: number | '';
    onSkipChange: (val: number | '') => void;
    count: boolean;
    onCountChange: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    schema, selectedSet, onSetChange, currentEntity,
    selectedProps, onPropChange,
    expandProps, onExpandChange,
    filter, onFilterChange,
    orderBy, onOrderByChange,
    orderByDir, onOrderByDirChange,
    top, onTopChange,
    skip, onSkipChange,
    count, onCountChange
}) => {

    const toggleSelection = (set: Set<string>, val: string, updater: (newSet: Set<string>) => void) => {
        const newSet = new Set(set);
        if (newSet.has(val)) newSet.delete(val);
        else newSet.add(val);
        updater(newSet);
    };

    return (
        <ScrollShadow className="flex-1 p-4">
            <div className="space-y-4">
                {/* Entity Select */}
                <Select 
                    label="Target Entity"
                    aria-label="Target Entity"
                    placeholder="Select an entity"
                    variant="bordered"
                    labelPlacement="outside"
                    selectedKeys={selectedSet ? [selectedSet] : []}
                    onSelectionChange={(keys) => onSetChange(Array.from(keys)[0] as string)}
                    startContent={<Database className="w-4 h-4 text-default-400" />}
                    classNames={{
                        trigger: "h-10",
                        value: "text-small"
                    }}
                >
                    {schema.entitySets.map(s => (
                        <SelectItem key={s.name} textValue={s.name}>
                            {s.name}
                        </SelectItem>
                    ))}
                </Select>

                {currentEntity ? (
                    <Accordion 
                        selectionMode="multiple" 
                        defaultExpandedKeys={["columns"]} 
                        isCompact 
                        variant="light"
                        itemClasses={{
                            title: "text-small font-medium",
                            trigger: "py-2",
                            content: "pb-2"
                        }}
                    >
                        {/* Columns */}
                        <AccordionItem 
                            key="columns" 
                            aria-label="Columns" 
                            title="Columns" 
                            startContent={<LayoutGrid className="w-4 h-4 text-primary" />}
                        >
                            <ScrollShadow className="max-h-[200px] border border-divider rounded-medium p-2 bg-default-50">
                                <CheckboxGroup size="sm" classNames={{ wrapper: "gap-1" }}>
                                    {currentEntity.properties.map(p => (
                                        <Checkbox 
                                            key={p.name} 
                                            value={p.name}
                                            isSelected={selectedProps.has(p.name)}
                                            onValueChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                        >
                                            <span className={`text-tiny ${selectedProps.has(p.name) ? "text-foreground font-medium" : "text-default-500"}`}>
                                                {p.name}
                                            </span>
                                        </Checkbox>
                                    ))}
                                </CheckboxGroup>
                            </ScrollShadow>
                        </AccordionItem>

                        {/* Expand */}
                        {currentEntity.navigationProperties.length > 0 && (
                            <AccordionItem 
                                key="relations" 
                                aria-label="Relations" 
                                title="Relations ($expand)" 
                                startContent={<Layers className="w-4 h-4 text-secondary" />}
                            >
                                <div className="space-y-1">
                                    {currentEntity.navigationProperties.map(np => (
                                        <Checkbox 
                                            key={np.name} 
                                            size="sm"
                                            isSelected={expandProps.has(np.name)}
                                            onValueChange={() => toggleSelection(expandProps, np.name, onExpandChange)}
                                            className="w-full max-w-full"
                                        >
                                            <span className="text-tiny">{np.name}</span>
                                        </Checkbox>
                                    ))}
                                </div>
                            </AccordionItem>
                        )}

                        {/* Filter */}
                        <AccordionItem 
                            key="filter" 
                            aria-label="Filter" 
                            title="Filter ($filter)" 
                            startContent={<Filter className="w-4 h-4 text-success" />}
                        >
                            <Input 
                                placeholder="Price gt 20" 
                                size="sm" 
                                variant="bordered"
                                value={filter}
                                onValueChange={onFilterChange}
                                description="OData filter expression"
                                classNames={{ input: "font-mono" }}
                                aria-label="Filter Expression"
                            />
                        </AccordionItem>

                        {/* Sort */}
                        <AccordionItem 
                            key="sort" 
                            aria-label="Sort" 
                            title="Sort ($orderby)" 
                            startContent={<ArrowUpDown className="w-4 h-4 text-warning" />}
                        >
                            <div className="flex gap-2">
                                <Select 
                                    placeholder="(Default)" 
                                    size="sm" 
                                    variant="bordered"
                                    className="flex-1"
                                    selectedKeys={orderBy ? [orderBy] : []}
                                    onSelectionChange={(keys) => onOrderByChange(Array.from(keys)[0] as string)}
                                    aria-label="Sort Column"
                                >
                                    {currentEntity.properties.map(p => (
                                        <SelectItem key={p.name}>{p.name}</SelectItem>
                                    ))}
                                </Select>
                                <Switch 
                                    size="sm"
                                    color="warning"
                                    isSelected={orderByDir === 'desc'}
                                    onValueChange={(isSelected) => onOrderByDirChange(isSelected ? 'desc' : 'asc')}
                                    thumbIcon={({ isSelected, className }) => 
                                        isSelected ? (
                                            <span className={className + " text-[8px] font-bold"}>ZA</span>
                                        ) : (
                                            <span className={className + " text-[8px] font-bold"}>AZ</span>
                                        )
                                    }
                                    aria-label="Sort Direction"
                                >
                                </Switch>
                            </div>
                        </AccordionItem>

                        {/* Pagination */}
                        <AccordionItem 
                            key="paging" 
                            aria-label="Paging" 
                            title="Pagination" 
                            startContent={<Hash className="w-4 h-4 text-danger" />}
                        >
                             <div className="grid grid-cols-2 gap-3 mb-3">
                                <Input 
                                    type="number" 
                                    label="Top" 
                                    size="sm" 
                                    variant="bordered"
                                    placeholder="All"
                                    value={String(top)}
                                    onValueChange={(v) => onTopChange(v ? Number(v) : '')}
                                    aria-label="Top"
                                />
                                <Input 
                                    type="number" 
                                    label="Skip" 
                                    size="sm" 
                                    variant="bordered"
                                    placeholder="0"
                                    value={String(skip)}
                                    onValueChange={(v) => onSkipChange(v ? Number(v) : '')}
                                    aria-label="Skip"
                                />
                            </div>
                            <Checkbox 
                                size="sm" 
                                isSelected={count}
                                onValueChange={onCountChange}
                                aria-label="Include Count"
                            >
                                <span className="text-tiny">Include Count ($inlinecount)</span>
                            </Checkbox>
                        </AccordionItem>
                    </Accordion>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <Database className="w-8 h-8 mb-2 stroke-1 text-default-300" />
                        <div className="text-center text-default-400 text-tiny">No Entity Selected</div>
                    </div>
                )}
            </div>
        </ScrollShadow>
    );
};

export default Sidebar;