import React from 'react';
import { AdsGrid as AdsGridWidget } from '@/widgets/ads';
import { AdItem } from '../model/types';

interface AdsGridProps {
    ads: AdItem[];
}

export const AdsGrid: React.FC<AdsGridProps> = (props) => {
    return <AdsGridWidget {...props} />;
};