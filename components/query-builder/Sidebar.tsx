import React from 'react';
import { Select, SelectItem } from "@nextui-org/select";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import { CheckboxGroup, Checkbox } from "@nextui-org/checkbox";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { ScrollShadow } from "@nextui-org/scroll-shadow";
import { Card, CardBody } from "@nextui-org/card";
import { Chip } from "@nextui-org/chip";
import { 
    Database, 
    LayoutGrid, 
    Layers, 
    Filter, 
    ArrowUpDown, 
    Hash,
    ChevronDown
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
        <ScrollShadow className="flex-1 px-4 py-6 bg-content1/50 h-full">
            <div className="space-y-6 pb-10">
                {/* Entity Select Header */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-default-500 uppercase tracking-wider ml-1">
                        Data Source
                    </label>
                    <Select 
                        aria-label="Target Entity"
                        placeholder="Select Entity Set"
                        variant="flat"
                        size="lg"
                        disallowEmptySelection
                        selectedKeys={selectedSet ? [selectedSet] : []}
                        onSelectionChange={(keys) => onSetChange(Array.from(keys)[0] as string)}
                        startContent={<Database className="w-5 h-5 text-primary" />}
                        classNames={{
                            trigger: "bg-content2 hover:bg-content3 transition-colors shadow-sm",
                            value: "font-semibold text-foreground text-medium",
                            popoverContent: "bg-content1"
                        }}
                        selectorIcon={<ChevronDown className="text-default-400" />}
                    >
                        {schema.entitySets.map(s => (
                            <SelectItem key={s.name} textValue={s.name} startContent={<div className="w-2 h-2 rounded-full bg-primary/50 mr-2"/>}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {currentEntity ? (
                    <Accordion 
                        selectionMode="multiple" 
                        defaultExpandedKeys={["columns", "filter"]} 
                        variant={"splitted" as any}
                        itemClasses={{
                            base: "group-[.is-splitted]:bg-content1 group-[.is-splitted]:shadow-sm group-[.is-splitted]:border group-[.is-splitted]:border-default-200 dark:group-[.is-splitted]:border-default-100",
                            title: "text-small font-semibold text-foreground",
                            subtitle: "text-tiny text-default-400",
                            trigger: "py-3",
                            content: "pt-0 pb-4 px-4",
                            indicator: "text-default-400"
                        }}
                    >
                        {/* Columns */}
                        <AccordionItem 
                            key="columns" 
                            aria-label="Columns" 
                            title="Fields" 
                            subtitle={`${selectedProps.size > 0 ? selectedProps.size : 'All'} selected`}
                            startContent={<LayoutGrid className="w-5 h-5 text-primary" />}
                        >
                            <div className="max-h-[240px] overflow-y-auto pr-1 scrollbar-hide">
                                <CheckboxGroup 
                                    size="sm" 
                                    classNames={{ wrapper: "gap-2" }}
                                    aria-label="Select Columns"
                                >
                                    {currentEntity.properties.map(p => (
                                        <div 
                                            key={p.name} 
                                            className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${selectedProps.has(p.name) ? 'bg-primary/10' : 'hover:bg-default-100'}`}
                                            onClick={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                        >
                                            <Checkbox 
                                                value={p.name}
                                                isSelected={selectedProps.has(p.name)}
                                                onValueChange={() => toggleSelection(selectedProps, p.name, onPropChange)}
                                                classNames={{ label: "text-small font-medium" }}
                                                radius="sm"
                                            >
                                                {p.name}
                                            </Checkbox>
                                            <Chip size="sm" variant="flat" className="h-5 text-[10px] px-0 min-w-0 text-default-400 bg-transparent border border-default-200">
                                                {p.type}
                                            </Chip>
                                        </div>
                                    ))}
                                </CheckboxGroup>
                            </div>
                        </AccordionItem>

                        {/* Expand */}
                        {currentEntity.navigationProperties.length > 0 && (
                            <AccordionItem 
                                key="relations" 
                                aria-label="Relations" 
                                title="Relations" 
                                subtitle="Expand related entities ($expand)"
                                startContent={<Layers className="w-5 h-5 text-secondary" />}
                            >
                                <div className="space-y-2">
                                    {currentEntity.navigationProperties.map(np => (
                                        <Checkbox 
                                            key={np.name} 
                                            size="sm"
                                            color="secondary"
                                            isSelected={expandProps.has(np.name)}
                                            onValueChange={() => toggleSelection(expandProps, np.name, onExpandChange)}
                                            classNames={{
                                                base: `w-full max-w-full p-2 rounded-lg border-2 transition-all ${expandProps.has(np.name) ? 'border-secondary bg-secondary/5' : 'border-transparent hover:bg-default-100'}`,
                                                label: "w-full"
                                            }}
                                        >
                                            <div className="flex flex-col w-full">
                                                <span className="text-small font-medium">{np.name}</span>
                                                <span className="text-tiny text-default-400 truncate w-full block">{np.type}</span>
                                            </div>
                                        </Checkbox>
                                    ))}
                                </div>
                            </AccordionItem>
                        )}

                        {/* Filter */}
                        <AccordionItem 
                            key="filter" 
                            aria-label="Filter" 
                            title="Filter" 
                            subtitle="OData Expression ($filter)"
                            startContent={<Filter className="w-5 h-5 text-success" />}
                        >
                            <Input 
                                placeholder="e.g. Price gt 20 and Name eq 'Milk'" 
                                size="sm" 
                                variant="faded"
                                radius="md"
                                value={filter}
                                onValueChange={onFilterChange}
                                classNames={{ 
                                    input: "font-mono text-small",
                                    inputWrapper: "bg-content2"
                                }}
                                aria-label="Filter Expression"
                            />
                        </AccordionItem>

                        {/* Sort */}
                        <AccordionItem 
                            key="sort" 
                            aria-label="Sort" 
                            title="Sorting" 
                            subtitle="Order results ($orderby)"
                            startContent={<ArrowUpDown className="w-5 h-5 text-warning" />}
                        >
                            <div className="flex gap-2 items-center">
                                <Select 
                                    placeholder="Sort Column" 
                                    size="sm" 
                                    variant="faded"
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
                                    size="lg"
                                    color="warning"
                                    isSelected={orderByDir === 'desc'}
                                    onValueChange={(isSelected) => onOrderByDirChange(isSelected ? 'desc' : 'asc')}
                                    thumbIcon={({ isSelected, className }) => 
                                        isSelected ? (
                                            <span className={className + " text-[10px] font-black"}>9-0</span>
                                        ) : (
                                            <span className={className + " text-[10px] font-black"}>0-9</span>
                                        )
                                    }
                                    classNames={{
                                        wrapper: "group-data-[selected=true]:bg-warning",
                                    }}
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
                            subtitle="Limit & Offset"
                            startContent={<Hash className="w-5 h-5 text-danger" />}
                        >
                             <div className="grid grid-cols-2 gap-3 mb-4">
                                <Input 
                                    type="number" 
                                    label="Top (Limit)" 
                                    labelPlacement="outside"
                                    size="sm" 
                                    variant="faded"
                                    placeholder="All"
                                    value={String(top)}
                                    onValueChange={(v) => onTopChange(v ? Number(v) : '')}
                                    aria-label="Top"
                                />
                                <Input 
                                    type="number" 
                                    label="Skip (Offset)" 
                                    labelPlacement="outside"
                                    size="sm" 
                                    variant="faded"
                                    placeholder="0"
                                    value={String(skip)}
                                    onValueChange={(v) => onSkipChange(v ? Number(v) : '')}
                                    aria-label="Skip"
                                />
                            </div>
                            <Card shadow="none" className="border border-default-200 bg-content2/50">
                                <CardBody className="p-3">
                                    <Checkbox 
                                        size="sm" 
                                        color="danger"
                                        isSelected={count}
                                        onValueChange={onCountChange}
                                        aria-label="Include Count"
                                        classNames={{ label: "text-small text-default-600" }}
                                    >
                                        Include Total Count ($inlinecount)
                                    </Checkbox>
                                </CardBody>
                            </Card>
                        </AccordionItem>
                    </Accordion>
                ) : (
                    <Card className="bg-content2/50 border border-dashed border-default-300 shadow-none">
                        <CardBody className="flex flex-col items-center justify-center py-12 text-default-400">
                            <Database className="w-10 h-10 mb-3 opacity-50" />
                            <p className="text-small font-medium">No Entity Selected</p>
                        </CardBody>
                    </Card>
                )}
            </div>
        </ScrollShadow>
    );
};

export default Sidebar;