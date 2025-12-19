'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateOrganizationModal from './CreateOrganizationModal';
import { useOrganizationsOnboarding } from '../../hooks/useOrganizationsOnboarding';

export default function CreateOrganizationOnboarding() {
  const { showCreateOrgModal, setShowCreateOrgModal } = useOrganizationsOnboarding();
  const router = useRouter();

  return (
    <CreateOrganizationModal
      open={showCreateOrgModal}
      forceCreate={true}
      onCreated={() => {
        setShowCreateOrgModal(false);
        router.refresh();
      }}
    />
  );
}
