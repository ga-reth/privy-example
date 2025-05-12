import { useOrder, useQuote } from '@omni-network/react'
import {
  useConnectWallet,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { formatEther, type Hex, parseEther, zeroAddress } from 'viem'
import { baseSepolia, holesky } from 'viem/chains'
import {
  useAccount,
  useBalance,
  useSwitchChain,
} from 'wagmi'
import { Heading } from './components'
import { shortenAddress } from './utils'

function App() {
  return (
    <>
      <Privy />
      <Quote />
      <Order />
    </>
  )
}

function Privy() {
  // privy hooks
  const { ready, authenticated, login } = usePrivy()
  const { connectWallet } = useConnectWallet()
  const { wallets, ready: walletsReady } = useWallets()

  // wagmi hooks
  const account = useAccount()
  const { setActiveWallet } = useSetActiveWallet()
  const { data, isLoading } = useBalance({ address: account.address, chainId: holesky.id })

  if (!ready || !walletsReady) {
    return (
      <div>
        <Heading title="Privy" />
        Loading...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div>
        <Heading title="Privy" />
        <button type="button" onClick={login}>
          login with privy
        </button>
      </div>
    )
  }

  return (
    <div>
      <Heading title="Privy" />

      <h4>privy external wallets</h4>
      {ready && account.status === 'disconnected' && (
        <>
          <p>You are not connected via Privy</p>
          <br />
        </>
      )}
      <div>
        <button
          type="button"
          onClick={() => connectWallet({ walletChainType: 'ethereum-only' })}
        >
          Connect external wallet
        </button>
      </div>

      {wallets.map((wallet) => {
        return (
          <div key={wallet.address}>
            <div>
              {wallet.address === account.address ? (
                <h4>active wallet</h4>
              ) : (
                <br />
              )}
              <div>privy wallet: {wallet.address}</div>
              {/* <div>privy wallet: {shortenAddress(wallet.address)}</div> */}
              <div>wallet type: {wallet.walletClientType}</div>
              {wallet.address !== account.address ? (
                  <button
                    onClick={() => {
                      setActiveWallet(wallet)
                    }}
                    type="button"
                  >
                    Make active
                  </button>

              ) : (
                <div>
                  balance:
                  {isLoading ? 'loading...' : data?.formatted}
                </div>
              )}
            </div>
          </div>
        )
      })}

      <h4>wagmi hooks</h4>
      {account.status !== 'disconnected' && (
        <div>
          <div>wagmi account: {shortenAddress(account.address)}</div>
          <div>wagmi chainId: {account.chainId}</div>
          <div>wagmi status: {account.status}</div>
        </div>
      )}
    </div>
  )
}

function Quote() {
  const account = useAccount()
  const quote = useQuote({
    srcChainId: holesky.id,
    destChainId: baseSepolia.id,
    deposit: { amount: parseEther('0.1'), isNative: true },
    expense: { isNative: true },
    mode: 'expense',
    enabled: true,
  })

  return (
    <div>
      <Heading title="Quote" />
      {account?.address ? (
        <>
          <h4>Quote swap from connected wallet to privy wallet</h4>
          <div>
            quote.deposit.amount:{' '}
            {quote.isSuccess ? formatEther(quote.deposit.amount) : ''}
          </div>
          <div>
            quote.expense.amount:{' '}
            {quote.isSuccess ? formatEther(quote.expense.amount) : ''}
          </div>
        </>
      ) : (
        <div>connect...</div>
      )}
    </div>
  )
}

function Order() {
  const { ready, authenticated } = usePrivy()
  const { wallets, ready: walletsReady } = useWallets()
  const account = useAccount()
  const { switchChain } = useSwitchChain()
  const expectedSrcChainId = holesky.id
  
  const privyWallet = wallets.find((wallet) => wallet.walletClientType === 'privy')

  const order = useOrder({
    owner: account?.address,
    srcChainId: holesky.id,
    destChainId: baseSepolia.id,
    deposit: { amount: parseEther('0.1') },
    expense: {
      amount: parseEther('0.099'),
      spender: zeroAddress,
    },
    calls: [{ target: privyWallet?.address as Hex ?? '0x', value: parseEther('0.099') }],
    validateEnabled: !!account?.address && !!privyWallet?.address,
  })

  if (!ready || !walletsReady) {
    return (
      <div>
        <Heading title="Order" />
        Loading...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div>
        <Heading title="Order" />
        Login with privy...
      </div>
    )
  }

  return (
    <div>
      <Heading title="Order" />
      {account?.address ? (
        <>
          <h4>Swap .1 eth from holesky connected wallet to base sepolia privy wallet</h4>
          <div>chainId: {account.chainId}</div>
          {expectedSrcChainId !== account.chainId && (
            <>
              <div>
                <div>wrong chain</div>
                <button
                  onClick={() => switchChain({ chainId: expectedSrcChainId })}
                  type="button"
                >
                  Switch chain
                </button>
              </div>
              <br />
            </>
          )}
          <div>validation: {order.validation?.status}</div>
          <div>status: {order.status}</div>
          <div>src chain tx hash: {order.txHash}</div>
          <div>isError: {order.isError}</div>
          <div>error: {order.error?.message}</div>
          <div>orderId: {order.orderId}</div>
          <button
            onClick={() => order.open()}
            disabled={
              order.validation?.status !== 'accepted' ||
              expectedSrcChainId !== account.chainId
            }
            type="button"
          >
            Swap
          </button>
        </>
      ) : (
        <div>connect...</div>
      )}
    </div>
  )
}

export default App
