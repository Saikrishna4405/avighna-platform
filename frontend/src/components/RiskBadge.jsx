import React from 'react';

export const RiskBadge = ({ level, score }) => {
  let badgeClass = 'badge-low';
  const l = (level || '').toUpperCase();
  
  if (l === 'CRITICAL' || score >= 70) badgeClass = 'badge-critical';
  else if (l === 'HIGH' || score >= 50) badgeClass = 'badge-high';
  else if (l === 'MODERATE' || score >= 30) badgeClass = 'badge-moderate';

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="pulse-dot pulse-red" style={{ display: (l==='CRITICAL'||l==='HIGH')?'inline-block':'none' }}></span>
      {l} {score !== undefined ? `(${score})` : ''}
    </span>
  );
};
