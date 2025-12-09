import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../../services/api';
import type { User, AdminUpdateUserRequest } from '../../types';
import { Modal, Form, FormSection, FormRow, FormGroup, Label, Input, Select, Checkbox, ErrorMessage } from '../atoms';
import { Edit } from 'lucide-react';

interface EditUserProps {
  user: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

const EditUser: React.FC<EditUserProps> = ({ user, onClose, onUserUpdated }) => {
  const { t } = useTranslation(['users', 'common']);
  const [formData, setFormData] = useState<AdminUpdateUserRequest>({
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    receiveEmails: user.receiveEmails
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userApi.updateUser(user.id, formData);
      onUserUpdated(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || t('editUser.messages.failedToUpdateUser');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('editUser.title')}
      titleIcon={Edit}
      onSubmit={handleSubmit}
      submitText={isLoading ? t('editUser.buttons.updating') : t('editUser.buttons.updateUser')}
      cancelText={t('editUser.buttons.cancel')}
      isSubmitting={isLoading}
    >
      <Form onSubmit={handleSubmit}>
        {error && <ErrorMessage message={error} />}

        <FormSection title={t('editUser.sections.personalInfo', { defaultValue: 'Personal Information' })}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="firstName">{t('editUser.fields.firstName')}</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="lastName">{t('editUser.fields.lastName')}</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection title={t('editUser.sections.accountDetails', { defaultValue: 'Account Details' })}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="username">{t('editUser.fields.username')}</Label>
              <Input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="email">{t('editUser.fields.email')}</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="role">{t('editUser.fields.role')}</Label>
            <Select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            >
              <option value="">{t('editUser.labels.selectRole')}</option>
              <option value="Admin">{t('editUser.roleOptions.admin')}</option>
              <option value="Manager">{t('editUser.roleOptions.manager')}</option>
              <option value="User">{t('editUser.roleOptions.user')}</option>
            </Select>
          </FormGroup>

          <Checkbox
            id="receiveEmails"
            name="receiveEmails"
            checked={formData.receiveEmails}
            onChange={handleInputChange}
            disabled={isLoading}
            label={t('editUser.labels.enableEmailNotifications')}
          />
        </FormSection>
      </Form>
    </Modal>
  );
};

export default EditUser;
