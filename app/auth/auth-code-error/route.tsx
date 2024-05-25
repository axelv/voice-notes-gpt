import { createClient } from "@/utils/supabase/server";
import { GetServerSideProps } from "next";

type Props = {
  error?: string;
};

const AuthPage: React.FC<Props> = ({ error }) => {
  return (
    <div>
      <h1>Authentication Page</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};
export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return {
      props: {
        error: error.message,
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default AuthPage;
