import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Supplier } from '../../types';
import { Building2, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

interface ViewSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
}

const ViewSupplier: React.FC<ViewSupplierProps> = ({
  isOpen,
  onClose,
  supplier
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('viewSupplier.title')}
      titleIcon={Building2}
      showCancel={true}
      cancelText={t('viewSupplier.buttons.close', { defaultValue: 'Close' })}
      maxWidth="700px"
    >
      <ViewContent>
        <ViewSection title={t('viewSupplier.sections.basicInformation')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewSupplier.fields.name')}</ViewLabel>
              <ViewValue>{supplier.name}</ViewValue>
            </ViewItem>
            {supplier.description && (
              <ViewItem fullWidth>
                <ViewLabel>{t('viewSupplier.fields.description')}</ViewLabel>
                <ViewValue>{supplier.description}</ViewValue>
              </ViewItem>
            )}
            {supplier.contactPerson && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.contactPerson')}</ViewLabel>
                <ViewValue>{supplier.contactPerson}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('viewSupplier.fields.status')}</ViewLabel>
              <ViewValue>
                <span className={`status-badge ${supplier.isActive ? 'status-active' : 'status-inactive'}`}>
                  {supplier.isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
                </span>
              </ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewSupplier.sections.contactInformation')}>
          <ViewGrid>
            {supplier.email && (
              <ViewItem>
                <ViewLabel icon={Mail}>{t('viewSupplier.fields.email')}</ViewLabel>
                <ViewValue>{supplier.email}</ViewValue>
              </ViewItem>
            )}
            {supplier.phone && (
              <ViewItem>
                <ViewLabel icon={Phone}>{t('viewSupplier.fields.phone')}</ViewLabel>
                <ViewValue>{supplier.phone}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewSupplier.sections.address')}>
          <ViewGrid>
            {supplier.address && (
              <ViewItem fullWidth>
                <ViewLabel>{t('viewSupplier.fields.streetAddress')}</ViewLabel>
                <ViewValue>{supplier.address}</ViewValue>
              </ViewItem>
            )}
            {supplier.city && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.city')}</ViewLabel>
                <ViewValue>{supplier.city}</ViewValue>
              </ViewItem>
            )}
            {supplier.postalCode && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.postalCode')}</ViewLabel>
                <ViewValue>{supplier.postalCode}</ViewValue>
              </ViewItem>
            )}
            {supplier.country && (
              <ViewItem>
                <ViewLabel icon={MapPin}>{t('viewSupplier.fields.country')}</ViewLabel>
                <ViewValue>{supplier.country}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewSupplier.sections.businessInformation')}>
          <ViewGrid>
            {supplier.taxId && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.taxId')}</ViewLabel>
                <ViewValue>{supplier.taxId}</ViewValue>
              </ViewItem>
            )}
            {supplier.registrationNumber && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.registrationNumber')}</ViewLabel>
                <ViewValue>{supplier.registrationNumber}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewSupplier.sections.statistics')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewSupplier.fields.totalAcquisitions')}</ViewLabel>
              <ViewValue>{supplier.totalAcquisitions}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('viewSupplier.fields.totalAcquisitionValue')}</ViewLabel>
              <ViewValue>{formatCurrency(supplier.totalAcquisitionValue)}</ViewValue>
            </ViewItem>
            {supplier.lastAcquisitionDate && (
              <ViewItem>
                <ViewLabel>{t('viewSupplier.fields.lastAcquisitionDate')}</ViewLabel>
                <ViewValue>{formatDate(supplier.lastAcquisitionDate)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        {supplier.notes && (
          <ViewSection title={t('viewSupplier.sections.notes')}>
            <ViewItem fullWidth>
              <ViewValue>{supplier.notes}</ViewValue>
            </ViewItem>
          </ViewSection>
        )}

        <ViewSection title={t('viewSupplier.sections.metadata')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel icon={User}>{t('viewSupplier.fields.createdBy')}</ViewLabel>
              <ViewValue>{supplier.createdByUserName}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel icon={Calendar}>{t('viewSupplier.fields.createdAt')}</ViewLabel>
              <ViewValue>{formatDate(supplier.createdAt)}</ViewValue>
            </ViewItem>
            {supplier.updatedAt && (
              <ViewItem>
                <ViewLabel icon={Calendar}>{t('viewSupplier.fields.updatedAt')}</ViewLabel>
                <ViewValue>{formatDate(supplier.updatedAt)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>
      </ViewContent>
    </Modal>
  );
};

export default ViewSupplier;

