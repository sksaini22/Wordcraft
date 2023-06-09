import { DraftPostsListsBody,  } from '@/components';
import { database } from '@/config/firebase';
import { IPostsData } from '@/types';
import { ref,  get, equalTo, orderByChild, query } from 'firebase/database';
import { GetServerSideProps } from 'next';


interface IDraftProps {
  posts:IPostsData;
  userId:string;
}

const Drafts = ({posts,userId}:IDraftProps) => {
  

  return (
    <DraftPostsListsBody posts={posts} userId={userId}/>
  )
}

export default Drafts;





// implementing getServerSideProps for server side fetching posts
export const getServerSideProps: GetServerSideProps = async (context) => {
  const userId  = context.query.userId as string;

  //   fetching data
  try {
      const postsRef = ref(database, 'drafts');
      const postsQuery = query(postsRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(postsQuery);
      if (snapshot.exists()) {
          const posts = snapshot.val() as IPostsData;
          return {
              props: {
                  posts,
                  userId
              }
          }
      } else {
          console.log("No posts available");
      }
  } catch (error) {
      console.error("Fire:--->",error);
  }

  return {
      props: {
          posts: {}
      }
  }
}