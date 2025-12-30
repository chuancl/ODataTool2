import React, { useState, useEffect } from 'react';
import { 
    Button,
    Input,
    Tabs, 
    Tab,
    Card, 
    CardBody,
    Switch,
    Listbox, 
    ListboxItem,
    ScrollShadow,
    Divider
} from '@heroui/react';
import { Database, FileUp, Search, Settings, Plus, Trash2, Power, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import { browser } from 'wxt/browser';
import { AppSettings, DEFAULT_SETTINGS } from '../../types';
import { getSettings, saveSettings } from '../../services/storageService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [inputUrl, setInputUrl] = useState('');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [whitelistInput, setWhitelistInput] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const openViewer = async (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    const viewerUrl = (browser.runtime as any).getURL(`/viewer.html?${query}`);
    await browser.tabs.create({ url: viewerUrl });
  };

  const handleUrlParse = () => {
    if (!inputUrl) return;
    openViewer({ sourceType: 'url', url: inputUrl });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await browser.storage.local.set({ 'temp_odata_content': content });
      openViewer({ sourceType: 'storage' });
    };
    reader.readAsText(file);
  };

  const addWhitelist = () => {
    if (!whitelistInput) return;
    const newList = [...settings.whitelist, whitelistInput];
    updateSetting('whitelist', newList);
    setWhitelistInput('');
  };

  const removeWhitelist = (index: number) => {
    const newList = [...settings.whitelist];
    newList.splice(index, 1);
    updateSetting('whitelist', newList);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      <header className="bg-primary p-4 shadow-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-white">
           <Database className="w-6 h-6" />
           <h1 className="font-bold text-lg">OData Explorer</h1>
        </div>
        <Button 
            isIconOnly 
            variant="light" 
            className="text-white"
            onPress={() => setActiveTab(activeTab === 'home' ? 'settings' : 'home')}
        >
            <Settings className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-hidden relative">
          {/* 使用绝对定位切换内容，模拟页面切换 */}
          <div className={`absolute inset-0 p-5 transition-transform duration-300 ${activeTab === 'home' ? 'translate-x-0' : '-translate-x-full opacity-0 pointer-events-none'}`}>
             <div className="space-y-6">
                {/* 快捷开关 */}
                <Card className={settings.enableGlobal ? "border-success-200 bg-success-50" : "bg-default-50"} shadow="sm">
                    <CardBody className="flex flex-row items-center justify-between p-4 overflow-hidden">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settings.enableGlobal ? 'bg-success text-white' : 'bg-default-200 text-default-500'}`}>
                                <Power className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-small">自动检测</h3>
                                <p className="text-tiny text-default-500">{settings.enableGlobal ? '已开启' : '已暂停'}</p>
                            </div>
                        </div>
                        <Switch 
                            isSelected={settings.enableGlobal} 
                            color="success"
                            onValueChange={(val) => updateSetting('enableGlobal', val)}
                        />
                    </CardBody>
                </Card>

                <div className="space-y-2">
                    <label className="text-small font-semibold flex items-center gap-2 text-default-600">
                        <Search className="w-4 h-4" />
                        解析在线 OData 服务
                    </label>
                    <div className="flex gap-2">
                        <Input
                            size="sm"
                            placeholder="输入 URL"
                            value={inputUrl}
                            onValueChange={setInputUrl}
                            className="flex-1"
                            startContent={<LinkIcon className="w-3.5 h-3.5 text-default-400" />}
                        />
                        <Button
                            color="primary"
                            size="sm"
                            onPress={handleUrlParse}
                            className="font-medium"
                        >
                            解析
                        </Button>
                    </div>
                </div>

                <Divider className="my-2" />

                <div className="space-y-2">
                    <label className="text-small font-semibold flex items-center gap-2 text-default-600">
                        <FileUp className="w-4 h-4" />
                        上传 Metadata 文件
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-default-300 rounded-large cursor-pointer hover:bg-default-100 hover:border-default-400 transition-colors group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileUp className="w-6 h-6 text-default-400 mb-2 group-hover:text-default-600 transition-colors" />
                            <p className="text-tiny text-default-500 group-hover:text-default-700">点击上传 .xml / .edmx</p>
                        </div>
                        <input type="file" className="hidden" accept=".xml,.edmx,.txt" onChange={handleFileUpload} />
                    </label>
                </div>
             </div>
          </div>

          <div className={`absolute inset-0 p-5 transition-transform duration-300 ${activeTab === 'settings' ? 'translate-x-0' : 'translate-x-full opacity-0 pointer-events-none'}`}>
             <div className="h-full flex flex-col">
                <div className="mb-4">
                    <h2 className="font-bold text-large mb-1 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        白名单管理
                    </h2>
                    <p className="text-tiny text-default-500">即便自动检测关闭，白名单内的网址仍会被插件自动接管。</p>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <Input 
                        size="sm"
                        placeholder="输入域名或关键字"
                        value={whitelistInput}
                        onValueChange={setWhitelistInput}
                    />
                    <Button isIconOnly size="sm" color="primary" onPress={addWhitelist}>
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                <ScrollShadow className="flex-1 rounded-medium border border-divider">
                    <Listbox 
                        aria-label="Whitelist" 
                        variant="flat"
                        emptyContent="暂无白名单"
                    >
                        {settings.whitelist.map((item, idx) => (
                            <ListboxItem 
                                key={idx}
                                endContent={
                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeWhitelist(idx)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                }
                                textValue={item}
                            >
                                <span className="font-mono text-small">{item}</span>
                            </ListboxItem>
                        ))}
                    </Listbox>
                </ScrollShadow>
                
                <Button size="sm" variant="light" onPress={() => setActiveTab('home')} className="mt-4">
                    返回
                </Button>
             </div>
          </div>
      </div>

      <footer className="p-3 text-center text-[10px] text-default-400 border-t border-divider bg-content1">
        OData Explorer v1.2
      </footer>
    </div>
  );
};

export default App;