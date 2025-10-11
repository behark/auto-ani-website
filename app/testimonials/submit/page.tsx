'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Upload, CheckCircle, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FormData {
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  content: string;
  location: string;
  vehicleId?: string;
  photos: File[];
}

export default function SubmitTestimonialPage() {
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    rating: 5,
    title: '',
    content: '',
    location: '',
    photos: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.photos.length > 4) {
      setError('Maksimumi 4 fotografi mund të ngarkohen');
      return;
    }
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...files] }));
    setError('');
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Upload photos to storage service first
      const photoUrls: string[] = []; // Will be populated after photo upload implementation

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          photos: photoUrls
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.error || 'Gabim në dërgimin e dëshmisë');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Gabim në dërgimin e dëshmisë. Ju lutem provoni përsëri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Faleminderit!
            </h2>
            <p className="text-gray-600 mb-6">
              Dëshmia juaj u dërgua me sukses dhe do të rishikohet para publikimit.
            </p>
            <div className="space-y-3">
              <Link href="/testimonials">
                <Button className="w-full">Shiko Dëshmitë e Tjera</Button>
              </Link>
              <Link href="/vehicles">
                <Button variant="outline" className="w-full">Shiko Veturat Tona</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Shkruaj Dëshminë Tënde
            </h1>
            <p className="text-gray-600">
              Ndani eksperiencën tuaj me AUTO ANI dhe ndihmoni klientë të tjerë
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="text-orange-500" />
                Informacionet Tuaja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Emri dhe Mbiemri *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Emri juaj i plotë"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email (opsional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Lokacioni</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Prishtinë, Mitrovicë, etj."
                  />
                </div>

                {/* Rating */}
                <div>
                  <Label>Vlerësimi Juaj *</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={cn(
                            "cursor-pointer",
                            star <= formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-300"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-medium">
                      {formData.rating}/5
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title">Titulli (opsional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Përmbledhje e shkurtër e eksperiencës"
                  />
                </div>

                {/* Content */}
                <div>
                  <Label htmlFor="content">Dëshmia Juaj *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Tregoni për eksperiencën tuaj me AUTO ANI..."
                    rows={6}
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.content.length}/1000 karaktere
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <Label>Fotografi (opsionale)</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-300 transition-colors">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 mb-2">
                        Ngarkoni fotografi të veturës ose të eksperiencës
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <Label
                        htmlFor="photo-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Zgjidh Fotografi
                      </Label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG deri në 5MB, maksimumi 4 fotografi
                      </p>
                    </div>

                    {/* Photo Previews */}
                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.photos.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.customerName || !formData.content}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting ? 'Duke dërguar...' : 'Dërgo Dëshminë'}
                  </Button>
                  <Link href="/testimonials">
                    <Button type="button" variant="outline">
                      Anullo
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <p>
                    Dëshmia juaj do të rishikohet nga ekipi ynë para publikimit.
                    Informacionet personale do të mbrohen sipas politikës sonë të privatësisë.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}