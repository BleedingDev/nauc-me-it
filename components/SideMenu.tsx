type DrawerProps = {
    readonly children: React.ReactNode
}

export function SideMenu({ children }: DrawerProps) {
    return <nav className='h-full bg-rightSide bg-no-repeat bg-contain bg-rightCut pl-4 pr-20 py-4'>{children}</nav>
}
