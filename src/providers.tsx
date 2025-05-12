import { OmniProvider } from '@omni-network/react'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { baseSepolia, holesky } from 'viem/chains'
import { http } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

const privyAppId = 'APP_ID'
const privyClientId = 'CLIENT_ID'

export const config = createConfig({
  chains: [baseSepolia, holesky],
  connectors: [metaMask()],
  transports: {
    [baseSepolia.id]: http(),
    [holesky.id]: http(),
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProvider
      appId={privyAppId}
      clientId={privyClientId}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['wallet', 'email'],
        defaultChain: baseSepolia,
        appearance: {
          showWalletLoginFirst: true,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <OmniProvider env="testnet">{children}</OmniProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
