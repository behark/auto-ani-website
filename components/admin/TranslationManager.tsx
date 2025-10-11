'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Languages,
  Search,
  Plus,
  Edit,
  Save,
  Download,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Copy,
} from 'lucide-react';

interface Translation {
  key: string;
  namespace: string;
  translations: {
    [locale: string]: string;
  };
  isComplete: boolean;
  lastModified: string;
}

interface TranslationNamespace {
  name: string;
  keyCount: number;
  completeness: {
    [locale: string]: number;
  };
}

const supportedLanguages = [
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export default function TranslationManager() {
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [namespaces, setNamespaces] = useState<TranslationNamespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newTranslation, setNewTranslation] = useState({
    key: '',
    namespace: 'common',
    translations: {} as { [locale: string]: string },
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTranslations();
    loadNamespaces();
  }, [selectedNamespace]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/translations?namespace=${selectedNamespace}`);
      const result = await response.json();

      if (result.success) {
        setTranslations(result.translations);
      } else {
        // Mock data for development
        setTranslations([
          {
            key: 'welcome.title',
            namespace: 'common',
            translations: {
              sq: 'Mirë se vini në AUTO ANI',
              en: 'Welcome to AUTO ANI',
              sr: 'Dobrodošli u AUTO ANI',
              ar: 'مرحباً بكم في AUTO ANI',
            },
            isComplete: true,
            lastModified: '2024-09-22T10:00:00Z',
          },
          {
            key: 'nav.vehicles',
            namespace: 'common',
            translations: {
              sq: 'Automjete',
              en: 'Vehicles',
              sr: 'Vozila',
              ar: 'المركبات',
            },
            isComplete: true,
            lastModified: '2024-09-22T09:30:00Z',
          },
          {
            key: 'vehicle.details.price',
            namespace: 'vehicles',
            translations: {
              sq: 'Çmimi',
              en: 'Price',
              sr: 'Cena',
              ar: '', // Missing translation
            },
            isComplete: false,
            lastModified: '2024-09-21T15:20:00Z',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error loading translations:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadNamespaces = async () => {
    try {
      const response = await fetch('/api/admin/translations/namespaces');
      const result = await response.json();

      if (result.success) {
        setNamespaces(result.namespaces);
      } else {
        // Mock data
        setNamespaces([
          {
            name: 'common',
            keyCount: 45,
            completeness: { sq: 100, en: 100, sr: 98, ar: 85 },
          },
          {
            name: 'vehicles',
            keyCount: 32,
            completeness: { sq: 100, en: 100, sr: 94, ar: 78 },
          },
          {
            name: 'ecommerce',
            keyCount: 67,
            completeness: { sq: 100, en: 100, sr: 91, ar: 72 },
          },
        ]);
      }
    } catch (error) {
      logger.error('Error loading namespaces:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const saveTranslation = async (key: string, translations: { [locale: string]: string }) => {
    try {
      const response = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          namespace: selectedNamespace,
          translations,
        }),
      });

      if (response.ok) {
        await loadTranslations();
        setEditingKey(null);
      }
    } catch (error) {
      logger.error('Error saving translation:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deleteTranslation = async (key: string) => {
    if (!confirm('Are you sure you want to delete this translation?')) return;

    try {
      const response = await fetch('/api/admin/translations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, namespace: selectedNamespace }),
      });

      if (response.ok) {
        await loadTranslations();
      }
    } catch (error) {
      logger.error('Error deleting translation:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const createNewTranslation = async () => {
    if (!newTranslation.key.trim()) return;

    await saveTranslation(newTranslation.key, newTranslation.translations);
    setNewTranslation({
      key: '',
      namespace: selectedNamespace,
      translations: {},
    });
    setIsCreating(false);
  };

  const exportTranslations = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/translations/export?format=${format}&namespace=${selectedNamespace}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translations-${selectedNamespace}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      logger.error('Error exporting translations:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const filteredTranslations = translations.filter(translation => {
    const matchesSearch = translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         Object.values(translation.translations).some(t =>
                           t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLanguage = selectedLanguage === 'all' ||
                           (selectedLanguage === 'incomplete' && !translation.isComplete) ||
                           translation.translations[selectedLanguage];

    return matchesSearch && matchesLanguage;
  });

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Languages className="w-5 h-5" />
          <span>Translation Manager</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Namespace Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {namespaces.map((namespace) => (
            <Card
              key={namespace.name}
              className={`cursor-pointer transition-colors ${
                selectedNamespace === namespace.name ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedNamespace(namespace.name)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold capitalize">{namespace.name}</h3>
                <p className="text-sm text-gray-600">{namespace.keyCount} keys</p>
                <div className="flex space-x-2 mt-2">
                  {supportedLanguages.map((lang) => (
                    <Badge
                      key={lang.code}
                      variant="outline"
                      className={getCompletenessColor(namespace.completeness[lang.code] || 0)}
                    >
                      {lang.flag} {namespace.completeness[lang.code] || 0}%
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search translations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => exportTranslations('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportTranslations('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Translation
            </Button>
          </div>
        </div>

        {/* Create New Translation */}
        {isCreating && (
          <Card className="border-blue-200">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="new-key">Translation Key</Label>
                <Input
                  id="new-key"
                  value={newTranslation.key}
                  onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                  placeholder="e.g., button.save"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportedLanguages.map((lang) => (
                  <div key={lang.code}>
                    <Label htmlFor={`new-${lang.code}`}>
                      {lang.flag} {lang.name}
                    </Label>
                    <Textarea
                      id={`new-${lang.code}`}
                      value={newTranslation.translations[lang.code] || ''}
                      onChange={(e) => setNewTranslation({
                        ...newTranslation,
                        translations: {
                          ...newTranslation.translations,
                          [lang.code]: e.target.value,
                        },
                      })}
                      placeholder={`Translation in ${lang.name}...`}
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button onClick={createNewTranslation}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Translation
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translations List */}
        <div className="space-y-4">
          {filteredTranslations.map((translation) => (
            <Card key={translation.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="font-medium">{translation.key}</h4>
                      <Badge variant={translation.isComplete ? 'default' : 'destructive'}>
                        {translation.isComplete ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {translation.isComplete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>

                    {editingKey === translation.key ? (
                      <div className="space-y-3">
                        {supportedLanguages.map((lang) => (
                          <div key={lang.code}>
                            <Label htmlFor={`edit-${lang.code}`}>
                              {lang.flag} {lang.name}
                            </Label>
                            <Textarea
                              id={`edit-${lang.code}`}
                              defaultValue={translation.translations[lang.code] || ''}
                              placeholder={`Translation in ${lang.name}...`}
                              rows={2}
                            />
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const updatedTranslations: { [locale: string]: string } = {};
                              supportedLanguages.forEach((lang) => {
                                const textarea = document.getElementById(`edit-${lang.code}`) as HTMLTextAreaElement;
                                if (textarea) {
                                  updatedTranslations[lang.code] = textarea.value;
                                }
                              });
                              saveTranslation(translation.key, updatedTranslations);
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingKey(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {supportedLanguages.map((lang) => (
                          <div key={lang.code} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              {lang.flag} {lang.name}
                            </p>
                            <p className="text-sm">
                              {translation.translations[lang.code] || (
                                <span className="text-red-500 italic">Missing translation</span>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingKey(translation.key)}
                      disabled={editingKey === translation.key}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const keyWithoutNamespace = translation.key.replace(`${translation.namespace}.`, '');
                        setNewTranslation({
                          key: `${keyWithoutNamespace}_copy`,
                          namespace: translation.namespace,
                          translations: { ...translation.translations },
                        });
                        setIsCreating(true);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTranslation(translation.key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTranslations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No translations found matching your criteria
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}