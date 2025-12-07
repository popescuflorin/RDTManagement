import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Package, FileText } from 'lucide-react';
import { Modal, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import { inventoryApi } from '../../services/api';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';

interface ActivateMaterialModalProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialActivated: (materialId: number) => void;
}

const ActivateMaterialModal: React.FC<ActivateMaterialModalProps> = ({ 
  material, 
  onClose, 
  onMaterialActivated 
}) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update material to set isActive = true
      await inventoryApi.updateMaterial(material.id, {
        ...material,
        isActive: true
      });
      onMaterialActivated(material.id);
      onClose();
    } catch (error: any) {
      console.error('Error activating material:', error);
      const errorMessage = error.response?.data?.message || t('activate.messages.failedToActivate');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('activate.title')}
      titleIcon={CheckCircle}
      submitText={isLoading ? t('activate.buttons.activating') : t('activate.buttons.activateMaterial')}
      cancelText={t('activate.buttons.cancel')}
      submitVariant="success"
      isSubmitting={isLoading}
      onSubmit={handleActivate}
      maxWidth="600px"
    >
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <p style={{ marginBottom: 'var(--space-lg)' }}>
        {t('activate.confirmationText')}
      </p>

      <ViewSection title={t('activate.materialDetails')} titleIcon={Package}>
        <ViewGrid>
          <ViewItem>
            <ViewLabel>{t('activate.labels.name')}</ViewLabel>
            <ViewValue>{material.name} ({material.color})</ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('activate.labels.type')}</ViewLabel>
            <ViewValue>
              {material.type === MaterialType.RawMaterial 
                ? t('filters.rawMaterials')
                : material.type === MaterialType.RecyclableMaterial
                ? t('filters.recyclableMaterials')
                : t('filters.finishedProducts')}
            </ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('activate.labels.currentStock')}</ViewLabel>
            <ViewValue>{material.quantity.toLocaleString()} {material.quantityType}</ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('activate.labels.minimumStock')}</ViewLabel>
            <ViewValue>{material.minimumStock.toLocaleString()} {material.quantityType}</ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('activate.labels.lastUpdated')}</ViewLabel>
            <ViewValue>{formatDate(material.updatedAt)}</ViewValue>
          </ViewItem>
        </ViewGrid>
      </ViewSection>

      {material.description && (
        <ViewSection title={t('activate.labels.description')} titleIcon={FileText}>
          <ViewItem fullWidth>
            <ViewValue>{material.description}</ViewValue>
          </ViewItem>
        </ViewSection>
      )}

      <div style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        marginTop: 'var(--space-md)',
        backgroundColor: 'var(--info-50)',
        border: '1px solid var(--info-200)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)'
      }}>
        <span style={{ fontSize: 'var(--text-lg)', marginTop: '2px' }}>ℹ️</span>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--info-700)' }}>
          <strong>{t('common:labels.notes', { defaultValue: 'Note' })}:</strong> {t('activate.note')}
        </div>
      </div>
    </Modal>
  );
};

export default ActivateMaterialModal;

