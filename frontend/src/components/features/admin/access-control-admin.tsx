'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  housesApi,
  houseRoomsApi,
  houseMembersApi,
  houseInvitationsApi,
  accessControlRightsApi,
  accessApiClient,
  mapCreateAccessRightToHouseDomain,
} from '@/lib/api-client';
import {
  AccessCheckResponse,
  CreateAccessRightDto,
  HouseAccessRightRequest,
  HouseAccessRightResponse,
  HouseInvitationRequest,
  HouseInvitationResponse,
  HouseMemberResponse,
  HouseRequest,
  HouseResponse,
  HouseRoomRequest,
  HouseRoomResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { LabeledInput } from '@/features/access-control/ui/house-details/tabs/LabeledInput';

function toArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const payload = data as { content?: unknown[]; data?: unknown[] };
  if (Array.isArray(payload.content)) return payload.content as T[];
  if (Array.isArray(payload.data)) return payload.data as T[];
  return [];
}

export function AccessControlAdmin() {
  const { t, locale } = useTranslation();

  const [status, setStatus] = useState<string>('');

  // Houses
  const [housesOwnerId, setHousesOwnerId] = useState('');
  const [houses, setHouses] = useState<HouseResponse[]>([]);
  const [editingHouseId, setEditingHouseId] = useState<number | null>(null);
  const [houseForm, setHouseForm] = useState<HouseRequest>({
    name: '',
    avatarUrl: '',
    address: '',
  });

  // House rooms
  const [roomsHouseId, setRoomsHouseId] = useState('');
  const [rooms, setRooms] = useState<HouseRoomResponse[]>([]);
  const [roomForm, setRoomForm] = useState<HouseRoomRequest>({
    name: '',
    houseId: 0,
  });
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);

  // House members
  const [membersHouseId, setMembersHouseId] = useState('');
  const [members, setMembers] = useState<HouseMemberResponse[]>([]);
  const [memberUserId, setMemberUserId] = useState('');

  // Invitations
  const [invitationsHouseId, setInvitationsHouseId] = useState('');
  const [invitations, setInvitations] = useState<HouseInvitationResponse[]>([]);
  const [invitationForm, setInvitationForm] = useState<{ roleId?: string; expiresAt?: string }>({
    expiresAt: '',
  });
  const [inviterId, setInviterId] = useState('');
  const [invitationToken, setInvitationToken] = useState('');
  const [invitationUserId, setInvitationUserId] = useState('');
  const [invitationIdToRevoke, setInvitationIdToRevoke] = useState('');

  // Access rights
  const [rightsHouseId, setRightsHouseId] = useState('');
  const [rights, setRights] = useState<HouseAccessRightResponse[]>([]);
  const [rightForm, setRightForm] = useState<HouseAccessRightRequest>({
    houseId: 0,
    houseMemberId: 0,
    accessRightType: 'ALLOW',
    deviceId: null,
    deviceFunctionId: null,
    houseRoomId: null,
    parameters: null,
    expiresAt: null,
  });
  const [rightGrantUserId, setRightGrantUserId] = useState('');
  const [rightIdToDelete, setRightIdToDelete] = useState('');
  const [parametersJson, setParametersJson] = useState('');

  // Access check
  const [checkData, setCheckData] = useState({
    houseId: '',
    userId: '',
    deviceId: '',
    deviceFunctionId: '',
    houseRoomId: '',
    operationType: '',
  });
  const [checkResult, setCheckResult] = useState<AccessCheckResponse | null>(null);

  const updateStatus = (message: string) => setStatus(message);

  // Houses handlers
  const loadHouses = async () => {
    if (!housesOwnerId) {
      updateStatus('Owner ID is required');
      return;
    }
    try {
      const data = await accessApiClient.houses.getHousesByUser(housesOwnerId, { page: 0, size: 50 });
      setHouses(toArray<HouseResponse>(data));
      updateStatus(t('common.success'));
    } catch (error) {
      console.error('Failed to load houses', error);
      updateStatus('Failed to load houses');
    }
  };

  const saveHouse = async () => {
    try {
      if (editingHouseId) {
        await housesApi.update(editingHouseId, houseForm);
      } else {
        await housesApi.create(houseForm);
      }
      setHouseForm({ name: '', avatarUrl: '', address: '' });
      setEditingHouseId(null);
      updateStatus(t('common.success'));
      if (housesOwnerId) {
        await loadHouses();
      }
    } catch (error) {
      console.error('Failed to save house', error);
      updateStatus('Failed to save house');
    }
  };

  const startEditHouse = (house: HouseResponse) => {
    setEditingHouseId(house.id);
    setHouseForm({
      name: house.name,
      avatarUrl: house.avatarUrl || '',
      address: house.address || '',
    });
  };

  const deleteHouse = async (id: number) => {
    try {
      await housesApi.delete(id);
      updateStatus(t('common.success'));
      if (housesOwnerId) {
        await loadHouses();
      }
    } catch (error) {
      console.error('Failed to delete house', error);
      updateStatus('Failed to delete house');
    }
  };

  // House rooms handlers
  const loadRooms = async () => {
    if (!roomsHouseId) {
      updateStatus('House ID is required');
      return;
    }
    try {
      const data = await houseRoomsApi.getByHouseId(Number(roomsHouseId));
      setRooms(toArray<HouseRoomResponse>(data));
      updateStatus(t('common.success'));
    } catch (error) {
      console.error('Failed to load house rooms', error);
      updateStatus('Failed to load house rooms');
    }
  };

  const saveRoom = async () => {
    try {
      const payload: HouseRoomRequest = {
        ...roomForm,
        houseId: Number(roomForm.houseId),
      };
      if (editingRoomId) {
        await houseRoomsApi.update(editingRoomId, payload);
      } else {
        await houseRoomsApi.create(payload);
      }
      setRoomForm({ name: '', houseId: 0 });
      setEditingRoomId(null);
      updateStatus(t('common.success'));
      if (roomsHouseId) {
        await loadRooms();
      }
    } catch (error) {
      console.error('Failed to save room', error);
      updateStatus('Failed to save room');
    }
  };

  const startEditRoom = (room: HouseRoomResponse) => {
    setEditingRoomId(Number(room.id));
    setRoomForm({ name: room.name ?? room.externalId ?? '', houseId: Number(room.houseId) });
  };

  const deleteRoom = async (id: number | string) => {
    try {
      await houseRoomsApi.delete(id);
      updateStatus(t('common.success'));
      if (roomsHouseId) {
        await loadRooms();
      }
    } catch (error) {
      console.error('Failed to delete room', error);
      updateStatus('Failed to delete room');
    }
  };

  // Members handlers
  const loadMembers = async () => {
    if (!membersHouseId) {
      updateStatus('House ID is required');
      return;
    }
    try {
      const data = await houseMembersApi.getByHouseId(Number(membersHouseId), { page: 0, size: 50 });
      setMembers(toArray<HouseMemberResponse>(data));
      updateStatus(t('common.success'));
    } catch (error) {
      console.error('Failed to load members', error);
      updateStatus('Failed to load members');
    }
  };

  const addMember = async () => {
    try {
      await houseMembersApi.addMember(Number(membersHouseId), memberUserId);
      updateStatus(t('common.success'));
      await loadMembers();
    } catch (error) {
      console.error('Failed to add member', error);
      updateStatus('Failed to add member');
    }
  };

  const removeMember = async (userId?: string) => {
    try {
      const idToRemove = userId ?? memberUserId;
      if (!idToRemove) return;
      await houseMembersApi.removeMember(Number(membersHouseId), idToRemove);
      updateStatus(t('common.success'));
      await loadMembers();
    } catch (error) {
      console.error('Failed to remove member', error);
      updateStatus('Failed to remove member');
    }
  };

  // Invitations
  const loadInvitations = async () => {
    if (!invitationsHouseId) {
      updateStatus('House ID is required');
      return;
    }
    try {
      const data = await houseInvitationsApi.getByHouseId(Number(invitationsHouseId), { page: 0, size: 50 });
      setInvitations(toArray<HouseInvitationResponse>(data));
      updateStatus(t('common.success'));
    } catch (error) {
      console.error('Failed to load invitations', error);
      updateStatus('Failed to load invitations');
    }
  };

  const createInvitation = async () => {
    if (!invitationsHouseId || !inviterId) {
      updateStatus('House ID and inviter user ID are required');
      return;
    }
    try {
      await houseInvitationsApi.create(
        Number(invitationsHouseId),
        {
          ...(invitationForm.roleId ? { roleId: invitationForm.roleId } : {}),
          ...(invitationForm.expiresAt ? { expiresAt: invitationForm.expiresAt } : {}),
        },
        inviterId
      );
      updateStatus(t('common.success'));
      await loadInvitations();
    } catch (error) {
      console.error('Failed to create invitation', error);
      updateStatus('Failed to create invitation');
    }
  };

  const acceptInvitation = async () => {
    try {
      await houseInvitationsApi.accept(invitationToken, invitationUserId);
      updateStatus(t('common.success'));
      if (invitationsHouseId) {
        await loadInvitations();
      }
    } catch (error) {
      console.error('Failed to accept invitation', error);
      updateStatus('Failed to accept invitation');
    }
  };

  const declineInvitation = async () => {
    updateStatus('Decline is not supported by API; invitation will expire after expiresAt.');
  };

  const revokeInvitation = async () => {
    if (!invitationIdToRevoke || !inviterId) {
      updateStatus('Invitation ID and user ID are required');
      return;
    }
    try {
      await houseInvitationsApi.revoke(invitationIdToRevoke, inviterId);
      updateStatus(t('common.success'));
      if (invitationsHouseId) {
        await loadInvitations();
      }
    } catch (error) {
      console.error('Failed to revoke invitation', error);
      updateStatus('Failed to revoke invitation');
    }
  };

  // Access rights
  const loadRights = async () => {
    if (!rightsHouseId) {
      updateStatus('House ID is required');
      return;
    }
    try {
      const data = await accessControlRightsApi.getByHouse(String(rightsHouseId), { page: 0, size: 50 });
      setRights(toArray<HouseAccessRightResponse>(data));
      updateStatus(t('common.success'));
    } catch (error) {
      console.error('Failed to load rights', error);
      updateStatus('Failed to load access rights');
    }
  };

  const createRight = async () => {
    try {
      const dto: CreateAccessRightDto = {
        resourceId: String(rightForm.deviceId ?? rightForm.houseRoomId ?? rightForm.houseId),
        houseMemberId: rightForm.houseMemberId ? String(rightForm.houseMemberId) : undefined,
        accessRightType: rightForm.accessRightType,
        expiresAt: rightForm.expiresAt || undefined,
      };
      await accessControlRightsApi.create(mapCreateAccessRightToHouseDomain(dto));
      updateStatus(t('common.success'));
      if (rightsHouseId) {
        await loadRights();
      }
    } catch (error) {
      console.error('Failed to create access right', error);
      updateStatus('Failed to create access right');
    }
  };

  const deleteRight = async () => {
    try {
      await accessControlRightsApi.delete(rightIdToDelete);
      updateStatus(t('common.success'));
      if (rightsHouseId) {
        await loadRights();
      }
    } catch (error) {
      console.error('Failed to delete right', error);
      updateStatus('Failed to delete access right');
    }
  };

  const checkAccess = async () => {
    // checkAccess endpoint removed in new RBAC API
    updateStatus('checkAccess endpoint removed');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t('admin.accessControl.title')}</h2>
          <p className="text-muted text-sm">{t('admin.subtitle')}</p>
        </div>
        {status && <Badge variant="secondary">{status}</Badge>}
      </div>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.houses')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <LabeledInput
              label={t('admin.accessControl.ownerId')}
              value={housesOwnerId}
              onChange={(e) => setHousesOwnerId(e.target.value)}
            />
            <Button onPress={loadHouses} variant="primary">
              {t('admin.accessControl.load')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <LabeledInput
              label={t('admin.name')}
              value={houseForm.name}
              onChange={(e) => setHouseForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <LabeledInput
              label="Avatar URL"
              value={houseForm.avatarUrl || ''}
              onChange={(e) => setHouseForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.description')}
              value={houseForm.address || ''}
              onChange={(e) => setHouseForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button onPress={saveHouse} variant="primary">
              {editingHouseId ? t('admin.edit') : t('admin.create')}
            </Button>
            {editingHouseId && (
              <Button
                variant="secondary"
                onPress={() => {
                  setEditingHouseId(null);
                  setHouseForm({ name: '', avatarUrl: '', address: '' });
                }}
              >
                {t('admin.clear')}
              </Button>
            )}
          </div>

          {houses.length > 0 && (
            <div className="space-y-2">
              {houses.map((house) => (
                <Card key={house.id}>
                  <Card.Header>
                    <div>
                      <Card.Title>{house.name}</Card.Title>
                      <Card.Description>{house.address}</Card.Description>
                    </div>
                    <Badge variant="outline">{house.ownerId}</Badge>
                  </Card.Header>
                  <Card.Footer className="flex gap-2">
                    <Button size="sm" variant="secondary" onPress={() => startEditHouse(house)}>
                      {t('admin.edit')}
                    </Button>
                    <Button size="sm" variant="danger" onPress={() => deleteHouse(house.id)}>
                      {t('admin.delete')}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.houseRooms')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={roomsHouseId}
              onChange={(e) => setRoomsHouseId(e.target.value)}
            />
            <Button onPress={loadRooms} variant="primary">
              {t('admin.accessControl.load')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.name')}
              value={roomForm.name}
              onChange={(e) => setRoomForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={roomForm.houseId?.toString() ?? ''}
              type="number"
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, houseId: Number(e.target.value) }))
              }
            />
            <div className="flex items-end gap-2">
              <Button onPress={saveRoom} variant="primary">
                {editingRoomId ? t('admin.edit') : t('admin.create')}
              </Button>
              {editingRoomId && (
                <Button
                  variant="secondary"
                  onPress={() => {
                    setEditingRoomId(null);
                    setRoomForm({ name: '', houseId: 0 });
                  }}
                >
                  {t('admin.clear')}
                </Button>
              )}
            </div>
          </div>

          {rooms.length > 0 && (
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <Card.Header>
                    <div>
                      <Card.Title>{room.name ?? room.externalId ?? '—'}</Card.Title>
                      <Card.Description>{room.houseName}</Card.Description>
                    </div>
                    <Badge variant="outline">{String(room.houseId)}</Badge>
                  </Card.Header>
                  <Card.Footer className="flex gap-2">
                    <Button size="sm" variant="secondary" onPress={() => startEditRoom(room)}>
                      {t('admin.edit')}
                    </Button>
                    <Button size="sm" variant="danger" onPress={() => deleteRoom(room.id)}>
                      {t('admin.delete')}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.members')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={membersHouseId}
              onChange={(e) => setMembersHouseId(e.target.value)}
            />
            <Button onPress={loadMembers} variant="primary">
              {t('admin.accessControl.load')}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.accessControl.userId')}
              value={memberUserId}
              onChange={(e) => setMemberUserId(e.target.value)}
            />
            <Button onPress={addMember} variant="primary">
              {t('admin.create')}
            </Button>
          </div>

          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((member) => (
                <Card key={member.id}>
                  <Card.Header>
                    <div>
                      <Card.Title>{member.userId}</Card.Title>
                      <Card.Description>{member.houseName}</Card.Description>
                    </div>
                    <Badge variant="outline">{String(member.houseId)}</Badge>
                  </Card.Header>
                  <Card.Footer>
                    <Button
                      size="sm"
                      variant="danger"
                      onPress={() => removeMember(member.userId)}
                    >
                      {t('admin.delete')}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.invitations')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={invitationsHouseId}
              onChange={(e) => setInvitationsHouseId(e.target.value)}
            />
            <Button onPress={loadInvitations} variant="primary">
              {t('admin.accessControl.load')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.accessControl.role')}
              value={invitationForm.roleId || ''}
              onChange={(e) => setInvitationForm((prev) => ({ ...prev, roleId: e.target.value || undefined }))}
            />
            <LabeledInput
              label={t('admin.accessControl.expiresAt')}
              value={invitationForm.expiresAt || ''}
              onChange={(e) => setInvitationForm((prev) => ({ ...prev, expiresAt: e.target.value || undefined }))}
            />
            <LabeledInput
              label={t('admin.accessControl.invitedBy')}
              value={inviterId}
              onChange={(e) => setInviterId(e.target.value)}
            />
            <Button onPress={createInvitation} variant="primary">
              {t('admin.create')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.accessControl.token')}
              value={invitationToken}
              onChange={(e) => setInvitationToken(e.target.value)}
            />
            <LabeledInput
              label={t('admin.accessControl.userId')}
              value={invitationUserId}
              onChange={(e) => setInvitationUserId(e.target.value)}
            />
            <div className="flex items-end gap-2">
              <Button onPress={acceptInvitation} variant="primary">
                Accept
              </Button>
              <Button onPress={declineInvitation} variant="secondary">
                Decline
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label="Invitation ID"
              value={invitationIdToRevoke}
              onChange={(e) => setInvitationIdToRevoke(e.target.value)}
            />
            <LabeledInput
              label={t('admin.accessControl.invitedBy')}
              value={inviterId}
              onChange={(e) => setInviterId(e.target.value)}
            />
            <Button onPress={revokeInvitation} variant="danger">
              Revoke
            </Button>
          </div>

          {invitations.length > 0 && (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <Card.Header>
                    <div>
                      <Card.Title>{invitation.note ?? (invitation.token ? `${invitation.token.slice(0, 12)}…` : 'Invitation')}</Card.Title>
                      <Card.Description>
                        {(() => {
                          const ru = locale === 'ru';
                          switch (invitation.status) {
                            case 'PENDING': return ru ? 'Ожидает' : 'Pending';
                            case 'ACCEPTED': return ru ? 'Принято' : 'Accepted';
                            case 'DECLINED': return ru ? 'Отклонено' : 'Declined';
                            case 'REVOKED': return ru ? 'Отозвано' : 'Revoked';
                            case 'EXPIRED': return ru ? 'Истекло' : 'Expired';
                            default: return invitation.status;
                          }
                        })()}
                      </Card.Description>
                    </div>
                    <Badge variant="outline">{invitation.houseId != null ? String(invitation.houseId) : '—'}</Badge>
                  </Card.Header>
                  <Card.Content>
                    <p className="text-sm text-muted">{invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : '—'}</p>
                    {invitation.token && <p className="text-xs font-mono text-muted">{invitation.token.slice(0, 16)}…</p>}
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.rights')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={rightsHouseId}
              onChange={(e) => setRightsHouseId(e.target.value)}
            />
            <Button onPress={loadRights} variant="primary">
              {t('admin.accessControl.load')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={rightForm.houseId?.toString() ?? ''}
              onChange={(e) =>
                setRightForm((prev) => ({ ...prev, houseId: Number(e.target.value) }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.memberId')}
              value={rightForm.houseMemberId?.toString() ?? ''}
              onChange={(e) =>
                setRightForm((prev) => ({ ...prev, houseMemberId: Number(e.target.value) }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.grantedBy')}
              value={rightGrantUserId}
              onChange={(e) => setRightGrantUserId(e.target.value)}
            />
            <LabeledInput
              label={t('admin.accessControl.deviceId')}
              value={rightForm.deviceId?.toString() ?? ''}
              onChange={(e) =>
                setRightForm((prev) => ({
                  ...prev,
                  deviceId: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.deviceFunctionId')}
              value={rightForm.deviceFunctionId?.toString() ?? ''}
              onChange={(e) =>
                setRightForm((prev) => ({
                  ...prev,
                  deviceFunctionId: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.houseRoomId')}
              value={rightForm.houseRoomId?.toString() ?? ''}
              onChange={(e) =>
                setRightForm((prev) => ({
                  ...prev,
                  houseRoomId: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.parameters')}
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
            />
            <LabeledInput
              label={t('admin.accessControl.expiresAt')}
              value={(rightForm.expiresAt as string) || ''}
              onChange={(e) =>
                setRightForm((prev) => ({ ...prev, expiresAt: e.target.value || null }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.operationType')}
              value={rightForm.accessRightType}
              onChange={(e) =>
                setRightForm((prev) => ({
                  ...prev,
                  accessRightType: e.target.value as HouseAccessRightRequest['accessRightType'],
                }))
              }
            />
            <Button onPress={createRight} variant="primary">
              {t('admin.create')}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label="Right ID"
              value={rightIdToDelete}
              onChange={(e) => setRightIdToDelete(e.target.value)}
            />
            <LabeledInput
              label={t('admin.accessControl.grantedBy')}
              value={rightGrantUserId}
              onChange={(e) => setRightGrantUserId(e.target.value)}
            />
            <Button onPress={deleteRight} variant="danger">
              {t('admin.delete')}
            </Button>
          </div>

          {rights.length > 0 && (
            <div className="space-y-2">
              {rights.map((right) => (
                <Card key={right.id}>
                  <Card.Header>
                    <div>
                      <Card.Title>{right.accessRightType}</Card.Title>
                      <Card.Description>
                        {right.houseRoomName || right.houseName || '—'}
                      </Card.Description>
                    </div>
                    <Badge variant="outline">{String(right.userId ?? right.houseMemberId ?? '—')}</Badge>
                  </Card.Header>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{t('admin.accessControl.check')}</Card.Title>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <LabeledInput
              label={t('admin.accessControl.houseId')}
              value={checkData.houseId}
              onChange={(e) => setCheckData((prev) => ({ ...prev, houseId: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.accessControl.userId')}
              value={checkData.userId}
              onChange={(e) => setCheckData((prev) => ({ ...prev, userId: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.accessControl.deviceId')}
              value={checkData.deviceId}
              onChange={(e) => setCheckData((prev) => ({ ...prev, deviceId: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.accessControl.deviceFunctionId')}
              value={checkData.deviceFunctionId}
              onChange={(e) =>
                setCheckData((prev) => ({ ...prev, deviceFunctionId: e.target.value }))
              }
            />
            <LabeledInput
              label={t('admin.accessControl.houseRoomId')}
              value={checkData.houseRoomId}
              onChange={(e) => setCheckData((prev) => ({ ...prev, houseRoomId: e.target.value }))}
            />
            <LabeledInput
              label={t('admin.accessControl.operationType')}
              value={checkData.operationType}
              onChange={(e) =>
                setCheckData((prev) => ({ ...prev, operationType: e.target.value }))
              }
            />
            <Button onPress={checkAccess} variant="primary">
              {t('admin.accessControl.send')}
            </Button>
          </div>

          {checkResult && (
            <div className="rounded-md border border-border bg-surface-2 p-3 text-sm">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(checkResult, null, 2)}
              </pre>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
