'use client'

import { useState } from 'react'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETH_RPC_URL),
})

interface ENSProfile {
  name: string
  address: string | null
  avatar: string | null
  records: Record<string, string>
}

const TEXT_RECORD_KEYS = [
  'email',
  'url',
  'description',
  'notice',
  'keywords',
  'com.twitter',
  'com.github',
  'com.discord',
  'org.telegram',
  'io.keybase',
  'avatar',
  'header',
  'name',
  'location',
]

export default function ENSLookup() {
  const [ensName, setEnsName] = useState('')
  const [profile, setProfile] = useState<ENSProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notRegistered, setNotRegistered] = useState<string | null>(null)

  const lookupENS = async () => {
    if (!ensName.trim()) return

    setLoading(true)
    setError(null)
    setProfile(null)
    setNotRegistered(null)

    try {
      const fullName = ensName.trim().toLowerCase().endsWith('.eth')
        ? ensName.trim().toLowerCase()
        : `${ensName.trim().toLowerCase()}.eth`
      const normalizedName = normalize(fullName)

      // Fetch address first (required to continue)
      const address = await client.getEnsAddress({ name: normalizedName })

      if (!address) {
        setNotRegistered(normalizedName)
        setLoading(false)
        return
      }

      // Fetch avatar and all text records in parallel
      const [avatar, ...textResults] = await Promise.all([
        client.getEnsAvatar({ name: normalizedName }).catch(() => null),
        ...TEXT_RECORD_KEYS.map(key =>
          client.getEnsText({ name: normalizedName, key })
            .then(value => ({ key, value }))
            .catch(() => ({ key, value: null }))
        ),
      ])

      // Build records object from results
      const records: Record<string, string> = {}
      for (const result of textResults) {
        if (result.value) {
          records[result.key] = result.value
        }
      }

      setProfile({
        name: normalizedName,
        address,
        avatar,
        records,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup ENS name')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    lookupENS()
  }

  const formatRecordKey = (key: string) => {
    const keyMap: Record<string, string> = {
      'com.twitter': 'Twitter',
      'com.github': 'GitHub',
      'com.discord': 'Discord',
      'org.telegram': 'Telegram',
      'io.keybase': 'Keybase',
    }
    return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
  }

  const getRecordLink = (key: string, value: string) => {
    const linkMap: Record<string, string> = {
      'com.twitter': `https://twitter.com/${value.replace('@', '')}`,
      'com.github': `https://github.com/${value}`,
      'url': value.startsWith('http') ? value : `https://${value}`,
      'email': `mailto:${value}`,
    }
    return linkMap[key]
  }

  const getFullEnsName = (name: string) => {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed) return ''
    if (trimmed.endsWith('.eth')) return trimmed
    return `${trimmed}.eth`
  }

  return (
    <div className="ens-lookup">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value.replace(/\.eth$/i, ''))}
            placeholder="vitalik"
            className="search-input"
          />
          <span className="search-input-suffix">.eth</span>
        </div>
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {notRegistered && (
        <div className="not-registered-card">
          <div className="not-registered-icon">?</div>
          <h3>{notRegistered}</h3>
          <p>This ENS name is not registered yet.</p>
          <a
            href={`https://app.ens.domains/${notRegistered}/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="register-button"
          >
            Register on ENS
          </a>
        </div>
      )}

      {profile && (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-header-content">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-name-section">
                <h2 className="profile-name">{profile.name}</h2>
                {profile.records.name && (
                  <p className="profile-display-name">{profile.records.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <h3>Address</h3>
              <p className="address">{profile.address}</p>
            </div>

            {profile.records.description && (
              <div className="profile-section">
                <h3>Description</h3>
                <p>{profile.records.description}</p>
              </div>
            )}

            {profile.records.location && (
              <div className="profile-section">
                <h3>Location</h3>
                <p>{profile.records.location}</p>
              </div>
            )}

            {Object.keys(profile.records).filter(k => !['description', 'name', 'avatar', 'header', 'location'].includes(k)).length > 0 && (
              <div className="profile-section">
                <h3>Links & Socials</h3>
                <div className="records-grid">
                  {Object.entries(profile.records)
                    .filter(([key]) => !['description', 'name', 'avatar', 'header', 'location'].includes(key))
                    .map(([key, value]) => {
                      const link = getRecordLink(key, value)
                      return (
                        <div key={key} className="record-item">
                          <span className="record-key">{formatRecordKey(key)}</span>
                          {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="record-value record-link">
                              {value}
                            </a>
                          ) : (
                            <span className="record-value">{value}</span>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
