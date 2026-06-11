import React, { useEffect, useState } from 'react';
import { KeyRound, Palette, Save } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toast';
import * as api from '@/api/endpoints';
import type { Settings } from '@/types';

const DEFAULT_API_PROVIDER_FORMAT = 'openai';
const DEFAULT_API_BASE_URL = 'https://yunai.chat';
const DEFAULT_TEXT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_CAPTION_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL_SOURCE = 'openai';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { show, ToastContainer } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL);
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [captionModel, setCaptionModel] = useState(DEFAULT_IMAGE_CAPTION_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await api.getSettings();
        if (response.data) {
          setSettings(response.data);
          setTextModel(response.data.text_model || DEFAULT_TEXT_MODEL);
          setImageModel(response.data.image_model || DEFAULT_IMAGE_MODEL);
          setCaptionModel(response.data.image_caption_model || DEFAULT_IMAGE_CAPTION_MODEL);
        }
      } catch (error) {
        console.error('加载设置失败:', error);
        show({ message: '加载设置失败', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Parameters<typeof api.updateSettings>[0] = {
        ai_provider_format: DEFAULT_API_PROVIDER_FORMAT,
        api_base_url: DEFAULT_API_BASE_URL,
        text_model: textModel.trim() || DEFAULT_TEXT_MODEL,
        image_model: imageModel.trim() || DEFAULT_IMAGE_MODEL,
        image_caption_model: captionModel.trim() || DEFAULT_IMAGE_CAPTION_MODEL,
        image_model_source: DEFAULT_IMAGE_MODEL_SOURCE,
      };

      const trimmedKey = apiKey.trim();
      if (trimmedKey) {
        payload.api_key = trimmedKey;
        payload.text_api_key = trimmedKey;
        payload.image_api_key = trimmedKey;
        payload.image_caption_api_key = trimmedKey;
      }

      const response = await api.updateSettings(payload);
      if (response.data) {
        setSettings(response.data);
        sessionStorage.setItem('banana-settings', JSON.stringify(response.data));
      }
      setApiKey('');
      show({ message: '配置已保存', type: 'success' });
    } catch (error: any) {
      console.error('保存配置失败:', error);
      show({
        message: error?.response?.data?.error?.message || error?.message || '保存配置失败',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const apiKeyPlaceholder =
    settings && settings.api_key_length > 0
      ? `已设置（长度: ${settings.api_key_length}）`
      : '输入凌云 API Key';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <ToastContainer />
      <div className="space-y-6">
        <div className="text-center pb-4 border-b border-gray-100 dark:border-border-primary">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-banana-50 dark:from-background-primary to-orange-50 rounded-full mb-3">
            <Palette size={18} className="text-banana-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-foreground-secondary">凌云 API</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-foreground-primary">快速配置</h2>
          <p className="text-sm text-gray-500 dark:text-foreground-tertiary mt-1">填写 Key，确认模型配置</p>
        </div>

        <div className="space-y-5">
          <Input
            label="API Key"
            type="password"
            placeholder={apiKeyPlaceholder}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={isLoading}
          />

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-foreground-secondary">
              <KeyRound size={16} />
              当前 API Base URL
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-foreground-tertiary">{DEFAULT_API_BASE_URL}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="文本大模型"
              type="text"
              value={textModel}
              onChange={(event) => setTextModel(event.target.value)}
              disabled={isLoading}
            />
            <Input
              label="图像生成模型"
              type="text"
              value={imageModel}
              onChange={(event) => setImageModel(event.target.value)}
              disabled={isLoading}
            />
            <Input
              label="图片识别模型"
              type="text"
              value={captionModel}
              onChange={(event) => setCaptionModel(event.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-border-primary">
          <Button variant="ghost" onClick={onClose}>
            关闭
          </Button>
          <Button
            icon={<Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={isLoading}
          >
            {isSaving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
