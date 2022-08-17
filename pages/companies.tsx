import { GetServerSideProps, NextPage } from "next"
import { Menu } from "../components/Menu"
import { DownArrow } from "../components/DownArrow"
import { Footer } from "../components/Footer"
import { Landing } from "../components/Landing"
import { How } from "../components/How"
import { Head } from "../components/Head"
import { LearnEarn, PayConsultancy, Time, Worldwide } from "../components/icons"
import { CompanyCatch } from "../components/CompanyCatch"
import { CompanyFormData, handleEmail, formatCompanyForm } from "../utils/email"
import { CompanyForm } from "../components/CompanyForm"
import { Employees } from "../components/Employees"
import { SideDecoration } from "../components/SideDecoration"

export const getServerSideProps: GetServerSideProps = handleEmail<CompanyFormData>(formatCompanyForm)

const employeeFormLink = "https://forms.gle/tSnwjVUnvovQy9NL8"
const links = [
    { title: "Jak to funguje?", link: "#how" },
    { title: "Informace", link: "#company" },
    { title: "Specializace", link: "#employees" },
    { title: "Kontakt", link: "#contact" },
    { title: "Chci zaměstnance", link: employeeFormLink, isImportant: true },
]

const Home: NextPage = () => {
    return (
        <div className='bg-landing bg-cover bg-fixed pt-20'>
            <Head
                desc='Chybí vám zaměstnanci? Chcete začít od píky, ale nemáte čas na přípravu juniorů? Jsme tu pro vás. Připravíme juniora na míru!'
                url='https://naucme.it/companies'
                twImg='https://naucme.it/twitter.png'
                fbImg='https://naucme.it/og.png'
            >
                <title>Nauč mě IT - Firmy</title>
            </Head>
            <Menu items={links} />
            <SideDecoration />

            <main>
                <Landing
                    title='Junior s praxí?'
                    subtitle='Dodáme vám ho!'
                    text={
                        <>
                            U nás vychováváme budoucí testery, developery i kodéry. Také zajišťujeme praxi, takže ani
                            úplný junior není bez zkušeností!
                        </>
                    }
                    catchPoints={[
                        { icon: <LearnEarn />, children: <>Ušetříte za výuku juniora, školí ho naši profesionálové</> },
                        {
                            icon: <PayConsultancy />,
                            children: <>Platíte pouze za odvedenou práci a zaměstnance</>,
                        },
                        {
                            icon: <Time />,
                            children: <>Sami určíte, kdy zaměstnance potřebujete</>,
                        },
                        { icon: <Worldwide />, children: <>Školíme plně online a není třeba žadných prostor</> },
                    ]}
                    buttonText='Chci zaměstnance!'
                    buttonProps={{ href: employeeFormLink }}
                />

                <DownArrow
                    className='mx-auto mb-20 cursor-pointer hidden md:block'
                    onClick={() => window.scrollBy(0, document.documentElement.clientHeight * 0.8)}
                />

                <How
                    steps={[
                        "Určení zadání a požadavků",
                        "Úprava materiálů na míru",
                        "Zařazení a školení studentů",
                        "Placená stáž s dozorem",
                        "Nástup do firmy",
                    ]}
                    buttonText='Chci zaměstnance!'
                    buttonProps={{ href: employeeFormLink }}
                />

                <CompanyCatch employeeLink={employeeFormLink} />

                <Employees link={employeeFormLink} />

                <CompanyForm />
            </main>

            <Footer links={links} />
        </div>
    )
}

export default Home
