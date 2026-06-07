/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = '', size = 24 }) => {
  // Gracefully fallback to a default Book icon if the requested name is not found
  const IconComponent = (Icons as any)[name] || Icons.BookOpen;
  return <IconComponent className={className} size={size} />;
};
