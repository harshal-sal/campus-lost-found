/**
 * src/components/CategoryArt.jsx
 * Renders an item's uploaded photo or a colorful category gradient tile with its Bootstrap Icon.
 */

import React from 'react';

const CATEGORY_ART = {
  Electronics: { icon: 'bi-phone', gradientClass: 'cat-grad-electronics' },
  Documents: { icon: 'bi-file-earmark-text', gradientClass: 'cat-grad-documents' },
  Keys: { icon: 'bi-key', gradientClass: 'cat-grad-keys' },
  Accessories: { icon: 'bi-watch', gradientClass: 'cat-grad-accessories' },
  Clothing: { icon: 'bi-bag', gradientClass: 'cat-grad-clothing' },
};

export default function CategoryArt({
  image,
  title,
  categoryName,
  variant = 'card',
  children,
}) {
  const art = CATEGORY_ART[categoryName] || {
    icon: 'bi-box-seam',
    gradientClass: 'cat-grad-default',
  };

  const frameClass =
    variant === 'detail'
      ? 'item-media-frame item-media-frame-lg'
      : variant === 'thumb'
        ? 'item-media-thumb'
        : 'item-media-frame';

  const tileModifier =
    variant === 'detail'
      ? 'category-tile-lg'
      : variant === 'thumb'
        ? 'category-tile-thumb'
        : '';

  return (
    <div className={frameClass}>
      {image ? (
        <img
          src={image}
          alt={title || 'Reported item'}
          className="item-media-img"
        />
      ) : (
        <div
          className={`category-tile ${art.gradientClass} ${tileModifier}`}
          aria-label={`${categoryName || 'Item'} placeholder`}
        >
          <i className={`bi ${art.icon} category-tile-icon`} aria-hidden="true" />
          {variant !== 'thumb' && (
            <span
              className="mt-2 fw-medium"
              style={{
                fontSize: variant === 'detail' ? '0.9rem' : '0.76rem',
                opacity: 0.9,
                letterSpacing: '0.02em',
              }}
            >
              {categoryName || 'Campus Item'}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
