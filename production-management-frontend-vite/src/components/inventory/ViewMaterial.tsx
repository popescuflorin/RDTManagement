import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Package, FileText } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';

interface ViewMaterialProps {
  material: RawMaterial;
  onClose: () => void;
}

const ViewMaterial: React.FC<ViewMaterialProps> = ({ material, onClose }) => {
  const { t } = useTranslation(['inventory', 'common']);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('view.title')}
      titleIcon={Eye}
      showCancel={true}
      cancelText={t('view.buttons.close')}
      maxWidth="800px"
    >
      <ViewContent>
        <ViewSection title={t('view.materialInformation')} titleIcon={Package}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('form.labels.name')}</ViewLabel>
              <ViewValue>{material.name} ({material.color})</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('form.labels.type')}</ViewLabel>
              <ViewValue>
                {material.type === MaterialType.RawMaterial 
                  ? t('filters.rawMaterials')
                  : material.type === MaterialType.RecyclableMaterial 
                  ? t('filters.recyclableMaterials')
                  : t('filters.finishedProducts')}
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('table.status')}</ViewLabel>
              <ViewValue>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  backgroundColor: material.isActive ? 'var(--success-100)' : 'var(--error-100)',
                  color: material.isActive ? 'var(--success-700)' : 'var(--error-700)'
                }}>
                  {material.isActive ? t('status.active') : t('status.inactive')}
                </span>
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('table.lastUpdated')}</ViewLabel>
              <ViewValue>{formatDate(material.updatedAt)}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('view.materialDetails')} titleIcon={FileText}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('view.fields.materialName')}</ViewLabel>
              <ViewValue>{material.name}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.fields.color')}</ViewLabel>
              <ViewValue>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      backgroundColor: material.color.toLowerCase(),
                      display: 'inline-block'
                    }}
                  />
                  {material.color}
                </div>
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.fields.materialType')}</ViewLabel>
              <ViewValue>
                {material.type === MaterialType.RawMaterial 
                  ? t('filters.rawMaterials')
                  : material.type === MaterialType.RecyclableMaterial 
                  ? t('filters.recyclableMaterials')
                  : t('filters.finishedProducts')}
              </ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.fields.unitType')}</ViewLabel>
              <ViewValue>{material.quantityType}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.fields.currentQuantity')}</ViewLabel>
              <ViewValue>{material.quantity.toLocaleString()} {material.quantityType}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('view.fields.minimumStockLevel')}</ViewLabel>
              <ViewValue>{material.minimumStock.toLocaleString()} {material.quantityType}</ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        {material.description && (
          <ViewSection title={t('view.fields.description')} titleIcon={FileText}>
            <ViewItem fullWidth>
              <ViewValue>{material.description}</ViewValue>
            </ViewItem>
          </ViewSection>
        )}

        {/* Stock Status Indicators */}
        <div style={{
          padding: 'var(--space-md)',
          borderRadius: 'var(--radius-md)',
          marginTop: 'var(--space-md)',
          backgroundColor: material.isLowStock ? 'var(--warning-50)' : 'var(--success-50)',
          border: `1px solid ${material.isLowStock ? 'var(--warning-200)' : 'var(--success-200)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <span style={{ fontSize: 'var(--text-lg)' }}>
            {material.isLowStock ? '⚠️' : '✅'}
          </span>
          <span style={{
            color: material.isLowStock ? 'var(--warning-700)' : 'var(--success-700)',
            fontSize: 'var(--text-sm)'
          }}>
            {material.isLowStock 
              ? t('view.stockIndicators.lowStockWarning', { quantity: material.quantity, minimum: material.minimumStock })
              : t('view.stockIndicators.stockLevelOk', { quantity: material.quantity, minimum: material.minimumStock })
            }
          </span>
        </div>
      </ViewContent>
    </Modal>
  );
};

export default ViewMaterial;

