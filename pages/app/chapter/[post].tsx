import { GetStaticPaths, GetStaticProps } from "next"
import { MDXRemote, MDXRemoteProps } from "next-mdx-remote"
import { serialize } from "next-mdx-remote/serialize"
import path from "path"
import { getAndParseMdx, getDataFromParsedMdx, getFilesAt } from "../../../utils/mdx"
import { components } from "../../../components/MdxWrapper"
import { Menu } from "../../../components/Menu"
import { SideMenu } from "../../../components/SideMenu"
import { Typography } from "../../../components/Typography"
import { Head } from "../../../components/Head"
import { TableOfContents } from "../../../components/TableOfContents"

type MenuData = Record<
    string,
    {
        readonly headings: readonly {
            readonly text: string
            readonly level: number
            readonly href: string
        }[]
        readonly content: string
        readonly data: {
            readonly title: string
        }
    }
>

type PostProps = {
    readonly mdx: MDXRemoteProps
    readonly menuData: MenuData
    readonly metaInformation: Record<string, string>
}

const Post: React.FC<PostProps> = ({ mdx, metaInformation, menuData }) => {
    const headings = Object.entries(menuData).flatMap(([_, d]) => d.headings)

    return (
        <>
            <Head desc={metaInformation.abstract} url=''>
                <title>{metaInformation.title}</title>
            </Head>
            <Menu items={[]} logoLink='#' />
            <div className='grid grid-cols-12 auto-rows-auto h-screen'>
                <div className='row-start-1 row-end-2 xl:row-end-7 xl:row-span-full col-span-full xl:col-span-2 mt-20 bg-secondary/5 overflow-auto'>
                    <SideMenu>
                        <TableOfContents headings={headings} />
                    </SideMenu>
                </div>
                <main className='row-end-7 xl:col-start-3 col-span-full row-start-3 xl:row-start-1 row-span-full overflow-auto px-10 xl:mt-20 pb-2 overscroll-none'>
                    <Typography className='py-4' variant='h2' component='h1'>
                        {metaInformation.title}
                    </Typography>
                    <MDXRemote {...mdx} components={components} />
                </main>
            </div>
        </>
    )
}

export const getStaticProps: GetStaticProps<PostProps> = async (props) => {
    const folderPath = path.join(process.cwd(), "chapters")
    const paths = getFilesAt(folderPath, ".mdx")

    const menuData = Object.fromEntries(
        paths
            .map((mdxName) => [mdxName, getAndParseMdx(folderPath, mdxName)] as const)
            .map(([mdxPath, { content, data }]) => [mdxPath, getDataFromParsedMdx(mdxPath, content, data)]),
    )
    const currentPost = menuData[props?.params?.post as string]
    const mdx = await serialize(currentPost.content)

    return {
        props: {
            mdx,
            metaInformation: currentPost.data,
            menuData,
        },
    }
}

export const getStaticPaths: GetStaticPaths = async () => {
    const folderPath = path.join(process.cwd(), "chapters")
    const paths = getFilesAt(folderPath, ".mdx").map((post) => ({ params: { post } }))

    return {
        paths,
        fallback: false,
    }
}

export default Post
