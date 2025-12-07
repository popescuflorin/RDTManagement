import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Package, FileText } from 'lucide-react';
import { Modal, ErrorMessage, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';
import { inventoryApi } from '../../services/api';
import type { RawMaterial } from '../../types';
import { MaterialType } from '../../types';

interface DeleteMaterialConfirmationProps {
  material: RawMaterial;
  onClose: () => void;
  onMaterialDeleted: (materialId: number) => void;
}

const DeleteMaterialConfirmation: React.FC<DeleteMaterialConfirmationProps> = ({ 
  material, 
  onClose, 
  onMaterialDeleted 
}) => {
  const { t } = useTranslation(['inventory', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update material to set isActive = false
      await inventoryApi.updateMaterial(material.id, {
        ...material,
        isActive: false
      });
      onMaterialDeleted(material.id);
      onClose();
    } catch (error: any) {
      console.error('Error deactivating material:', error);
      const errorMessage = error.response?.data?.message || t('deactivate.messages.failedToDeactivate');
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
      title={t('deactivate.title')}
      titleIcon={XCircle}
      submitText={isLoading ? t('deactivate.buttons.deactivating') : t('deactivate.buttons.deactivateMaterial')}
      cancelText={t('deactivate.buttons.cancel')}
      submitVariant="danger"
      isSubmitting={isLoading}
      onSubmit={handleDeactivate}
      maxWidth="600px"
    >
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <p style={{ marginBottom: 'var(--space-lg)' }}>
        {t('deactivate.confirmationText')}
      </p>

      <ViewSection title={t('deactivate.materialDetails')} titleIcon={Package}>
        <ViewGrid>
          <ViewItem>
            <ViewLabel>{t('deactivate.labels.name')}</ViewLabel>
            <ViewValue>{material.name} ({material.color})</ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('deactivate.labels.type')}</ViewLabel>
            <ViewValue>
              {material.type === MaterialType.RawMaterial 
                ? t('filters.rawMaterials')
                : material.type === MaterialType.RecyclableMaterial
                ? t('filters.recyclableMaterials')
                : t('filters.finishedProducts')}
            </ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('deactivate.labels.currentStock')}</ViewLabel>
            <ViewValue>{material.quantity.toLocaleString()} {material.quantityType}</ViewValue>
          </ViewItem>
          <ViewItem>
            <ViewLabel>{t('deactivate.labels.lastUpdated')}</ViewLabel>
            <ViewValue>{formatDate(material.updatedAt)}</ViewValue>
          </ViewItem>
        </ViewGrid>
      </ViewSection>

      {material.description && (
        <ViewSection title={t('deactivate.labels.description')} titleIcon={FileText}>
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
          <strong>{t('common:labels.notes', { defaultValue: 'Note' })}:</strong> {t('deactivate.note')}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteMaterialConfirmation;
