'use client';

import { useState } from 'react';
import { User, Mail, Phone, Briefcase, Euro, FileText, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function PreQualificationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employmentStatus: '',
    monthlyIncome: '',
    loanAmount: '',
    preferredTerm: '',
    hasTradeIn: false,
    agreeTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreeTerms) {
      toast.error('Ju lutem pranoni kushtet dhe termat');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Aplikimi juaj është dërguar me sukses! Do t\'ju kontaktojmë së shpejti.');
      setIsSubmitting(false);

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        employmentStatus: '',
        monthlyIncome: '',
        loanAmount: '',
        preferredTerm: '',
        hasTradeIn: false,
        agreeTerms: false,
      });
    }, 2000);
  };

  const handleInputChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Emri dhe Mbiemri
        </Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          placeholder="Filan Fisteku"
          required
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="email@example.com"
          required
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Numri i Telefonit
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+383 4x xxx xxx"
          required
        />
      </div>

      {/* Employment Status */}
      <div className="space-y-2">
        <Label htmlFor="employment" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Statusi i Punësimit
        </Label>
        <Select
          value={formData.employmentStatus}
          onValueChange={(value) => handleInputChange('employmentStatus', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Zgjidhni statusin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employed">I/E punësuar</SelectItem>
            <SelectItem value="self-employed">Vetë-punësim</SelectItem>
            <SelectItem value="business-owner">Pronar biznesi</SelectItem>
            <SelectItem value="retired">Pensionist</SelectItem>
            <SelectItem value="other">Tjetër</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Income */}
      <div className="space-y-2">
        <Label htmlFor="income" className="flex items-center gap-2">
          <Euro className="w-4 h-4" />
          Të Ardhurat Mujore
        </Label>
        <Select
          value={formData.monthlyIncome}
          onValueChange={(value) => handleInputChange('monthlyIncome', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Zgjidhni rangun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-500">€0 - €500</SelectItem>
            <SelectItem value="500-1000">€500 - €1,000</SelectItem>
            <SelectItem value="1000-2000">€1,000 - €2,000</SelectItem>
            <SelectItem value="2000-3000">€2,000 - €3,000</SelectItem>
            <SelectItem value="3000+">€3,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loan Amount */}
      <div className="space-y-2">
        <Label htmlFor="loanAmount" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Shuma e Kërkuar
        </Label>
        <Input
          id="loanAmount"
          type="number"
          value={formData.loanAmount}
          onChange={(e) => handleInputChange('loanAmount', e.target.value)}
          placeholder="€15,000"
          min="1000"
          required
        />
      </div>

      {/* Preferred Term */}
      <div className="space-y-2">
        <Label htmlFor="term" className="flex items-center gap-2">
          Periudha e Preferuar
        </Label>
        <Select
          value={formData.preferredTerm}
          onValueChange={(value) => handleInputChange('preferredTerm', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Zgjidhni periudhën" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12 muaj</SelectItem>
            <SelectItem value="24">24 muaj</SelectItem>
            <SelectItem value="36">36 muaj</SelectItem>
            <SelectItem value="48">48 muaj</SelectItem>
            <SelectItem value="60">60 muaj</SelectItem>
            <SelectItem value="72">72 muaj</SelectItem>
            <SelectItem value="84">84 muaj</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trade-In */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="tradeIn"
          checked={formData.hasTradeIn}
          onCheckedChange={(checked) => handleInputChange('hasTradeIn', checked as boolean)}
        />
        <Label
          htmlFor="tradeIn"
          className="text-sm font-normal cursor-pointer"
        >
          Kam veturë për shkëmbim
        </Label>
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start space-x-2">
        <Checkbox
          id="terms"
          checked={formData.agreeTerms}
          onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
        />
        <Label
          htmlFor="terms"
          className="text-sm font-normal cursor-pointer"
        >
          Pranoj që të dhënat e mia të përdoren për vlerësim kreditor dhe kontakt nga AUTO ANI
        </Label>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-[var(--primary-orange)] hover:bg-orange-600"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>Dërgohet...</>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Dërgo Aplikimin
          </>
        )}
      </Button>

      {/* Note */}
      <p className="text-xs text-gray-500 text-center">
        Aplikimi nuk ju obligon për marrjen e kredisë. Do të kontaktoheni brenda 24 orëve.
      </p>
    </form>
  );
}