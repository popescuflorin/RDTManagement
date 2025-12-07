import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '../../types';
import { UserCircle, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { Modal, ViewContent, ViewSection, ViewGrid, ViewItem, ViewLabel, ViewValue } from '../atoms';

interface ViewClientProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const ViewClient: React.FC<ViewClientProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const { t } = useTranslation(['clients', 'common']);

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
      title={t('viewClient.title')}
      titleIcon={UserCircle}
      showCancel={true}
      cancelText={t('viewClient.buttons.close', { defaultValue: 'Close' })}
      maxWidth="700px"
    >
      <ViewContent>
        <ViewSection title={t('viewClient.sections.basicInformation')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewClient.fields.name')}</ViewLabel>
              <ViewValue>{client.name}</ViewValue>
            </ViewItem>
            {client.contactPerson && (
              <ViewItem>
                <ViewLabel>{t('viewClient.fields.contactPerson')}</ViewLabel>
                <ViewValue>{client.contactPerson}</ViewValue>
              </ViewItem>
            )}
            <ViewItem>
              <ViewLabel>{t('viewClient.fields.status')}</ViewLabel>
              <ViewValue>
                <span className={`status-badge ${client.isActive ? 'status-active' : 'status-inactive'}`}>
                  {client.isActive ? t('clients.status.active') : t('clients.status.inactive')}
                </span>
              </ViewValue>
            </ViewItem>
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewClient.sections.contactInformation')}>
          <ViewGrid>
            {client.email && (
              <ViewItem>
                <ViewLabel icon={Mail}>{t('viewClient.fields.email')}</ViewLabel>
                <ViewValue>{client.email}</ViewValue>
              </ViewItem>
            )}
            {client.phone && (
              <ViewItem>
                <ViewLabel icon={Phone}>{t('viewClient.fields.phone')}</ViewLabel>
                <ViewValue>{client.phone}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewClient.sections.address')}>
          <ViewGrid>
            {client.address && (
              <ViewItem fullWidth>
                <ViewLabel>{t('viewClient.fields.streetAddress')}</ViewLabel>
                <ViewValue>{client.address}</ViewValue>
              </ViewItem>
            )}
            {client.city && (
              <ViewItem>
                <ViewLabel>{t('viewClient.fields.city')}</ViewLabel>
                <ViewValue>{client.city}</ViewValue>
              </ViewItem>
            )}
            {client.postalCode && (
              <ViewItem>
                <ViewLabel>{t('viewClient.fields.postalCode')}</ViewLabel>
                <ViewValue>{client.postalCode}</ViewValue>
              </ViewItem>
            )}
            {client.country && (
              <ViewItem>
                <ViewLabel icon={MapPin}>{t('viewClient.fields.country')}</ViewLabel>
                <ViewValue>{client.country}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        <ViewSection title={t('viewClient.sections.statistics')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel>{t('viewClient.fields.totalOrders')}</ViewLabel>
              <ViewValue>{client.totalOrders}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel>{t('viewClient.fields.totalOrderValue')}</ViewLabel>
              <ViewValue>{formatCurrency(client.totalOrderValue)}</ViewValue>
            </ViewItem>
            {client.lastOrderDate && (
              <ViewItem>
                <ViewLabel>{t('viewClient.fields.lastOrderDate')}</ViewLabel>
                <ViewValue>{formatDate(client.lastOrderDate)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>

        {client.notes && (
          <ViewSection title={t('viewClient.sections.notes')}>
            <ViewItem fullWidth>
              <ViewValue>{client.notes}</ViewValue>
            </ViewItem>
          </ViewSection>
        )}

        <ViewSection title={t('viewClient.sections.metadata')}>
          <ViewGrid>
            <ViewItem>
              <ViewLabel icon={User}>{t('viewClient.fields.createdBy')}</ViewLabel>
              <ViewValue>{client.createdByUserName}</ViewValue>
            </ViewItem>
            <ViewItem>
              <ViewLabel icon={Calendar}>{t('viewClient.fields.createdAt')}</ViewLabel>
              <ViewValue>{formatDate(client.createdAt)}</ViewValue>
            </ViewItem>
            {client.updatedAt && (
              <ViewItem>
                <ViewLabel icon={Calendar}>{t('viewClient.fields.updatedAt')}</ViewLabel>
                <ViewValue>{formatDate(client.updatedAt)}</ViewValue>
              </ViewItem>
            )}
          </ViewGrid>
        </ViewSection>
      </ViewContent>
    </Modal>
  );
};

export default ViewClient;

