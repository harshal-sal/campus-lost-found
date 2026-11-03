import React from 'react';
import {
  Laptop,
  CreditCard,
  Wallet,
  Key,
  ShoppingBag,
  BookOpen,
  Shirt,
  Glasses,
  HelpCircle,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Bookmark,
  Share2,
  Sparkles,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name.toLowerCase()) {
    case 'laptop':
    case 'electronics':
      return <Laptop className={className} />;
    case 'creditcard':
    case 'id-cards':
      return <CreditCard className={className} />;
    case 'wallet':
    case 'wallets':
      return <Wallet className={className} />;
    case 'key':
    case 'keys':
      return <Key className={className} />;
    case 'shoppingbag':
    case 'bags':
      return <ShoppingBag className={className} />;
    case 'bookopen':
    case 'books':
      return <BookOpen className={className} />;
    case 'shirt':
    case 'clothing':
      return <Shirt className={className} />;
    case 'glasses':
    case 'accessories':
      return <Glasses className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};
