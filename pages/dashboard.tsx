import Image from "next/image"
import { GetStaticProps } from "next"
import { Head } from "../components/Head"
import { InAppMenu } from "../components/InAppMenu"
import { SideMenu } from "../components/SideMenu"
import { TableOfContents } from "../components/TableOfContents"
import path from "path"
import { getAndParseMdx, getFilesAt } from "../utils/mdx"
import { getSourceId } from "../utils/string"
import { MissingBanner } from "../components/MissingBanner"
import { ContentCard } from "../components/ContentCard"
import { Root } from "@radix-ui/react-separator"
import { Typography } from "../components/Typography"

type DashboardProps = {
    readonly headings: readonly {
        readonly text: string
        readonly level: number
        readonly href: string
    }[]
}

const Dashboard: React.FC<DashboardProps> = ({ headings }) => {
    return (
        <>
            <Head
                desc='Dostaň se do IT ještě dnes a sleduj svou cestu junior testera či programátora právě zde!'
                url='https://naucme.it/dashboard'
            >
                <title>Nauč mě IT - Dashboard</title>
            </Head>
            <InAppMenu />
            <div className='grid grid-cols-12 auto-rows-auto h-screen'>
                <div className='row-start-1 row-end-2 xl:row-end-7 xl:row-span-full col-span-full xl:col-span-2 mt-20 bg-secondary/5 overflow-auto'>
                    <SideMenu>
                        <TableOfContents headings={headings} />
                    </SideMenu>
                </div>
                <main className='row-end-7 xl:col-start-3 col-span-full row-start-3 xl:row-start-1 row-span-full overflow-auto xl:mt-20 pb-2 overscroll-none'>
                    <MissingBanner />
                    <section className='flex flex-col lg:flex-row justify-center items-center lg:items-start mt-5 gap-10'>
                        <ContentCard title='Kurz QA' priority phrase='Začít' href='/chapter/qa-0'>
                            <Image
                                src='/images/qa_illustration.svg'
                                width={320}
                                height={291}
                                alt='Ilustrace ke kurzu QA'
                                loading='lazy'
                            />
                        </ContentCard>
                        <ContentCard title='Discord' phrase='Připojit se' href='https://discord.gg/QbYswwYUPU'>
                            <Image
                                src='/images/discord.svg'
                                width={205}
                                height={291}
                                alt='Ilustrace ke kurzu QA'
                                loading='lazy'
                            />
                        </ContentCard>
                    </section>
                    <Root className='my-8 h-px w-11/12 mx-auto bg-secondary' />
                    <section className='flex flex-col items-center mt-5 gap-8'>
                        <Typography variant='h3'>Externí zdroje</Typography>
                        <div className='flex flex-col lg:flex-row justify-center items-center lg:items-start gap-10'>
                            <ContentCard small title='Vzhůru dolů' phrase='Učit se' href='/chapter/qa-0'>
                                <Image
                                    src='/images/vzhuru.svg'
                                    width={100}
                                    height={100}
                                    alt='Logo Vzhůru dolů'
                                    loading='lazy'
                                />
                            </ContentCard>
                            <ContentCard small title='Junior Guru' phrase='Navštívit' href='/chapter/qa-0'>
                                <Image
                                    src='/images/junior-guru.svg'
                                    width={200}
                                    height={100}
                                    alt='Logo Junior Guru'
                                    loading='lazy'
                                />
                            </ContentCard>
                            <ContentCard small title='Videa DevTools' phrase='Koukat' href='/chapter/qa-0'>
                                <Image
                                    src='/images/devtools.svg'
                                    width={100}
                                    height={100}
                                    alt='Play btn'
                                    loading='lazy'
                                />
                            </ContentCard>
                        </div>
                    </section>
                </main>
            </div>
        </>
    )
}

export const getStaticProps: GetStaticProps<{}> = async () => {
    const folderPath = path.join(process.cwd(), "chapters")
    const paths = getFilesAt(folderPath, ".mdx")

    const headings = paths.flatMap((mdxName) => {
        const { data } = getAndParseMdx(folderPath, mdxName)
        return { text: data.title, level: 1, href: `/chapter/${mdxName}#${getSourceId(data.title)}` }
    })

    return {
        props: {
            headings,
        },
    }
}

export default Dashboard
