/* Creating and Nesting Components
   ----------------------------------------------------------------------------

   React apps are made out of components. A component is a piece of
   the UI (user interface) that has its own logic and appearance.
   A component can be as small as a button, or as large as an entire page.

   React components are JavaScript functions that return markup:
*/

function MyButton() { return (<button>I'm a button</button>); }

// Now that you've declared 'MyButton', you can nest it into another component:
   
export default function MyApp()
{
    return
   (
        <div>
           <h1>Welcome to my app</h1>
           <MyButton />
        </div>
    );
}
   
/* Notice that <MyButton /> starts with a capital letter. That’s how you
  know it’s a React component. React component names must always
  start with a capital letter, while HTML tags must be lowercase.

  The export default keywords specify the main component in the file.



  Writing Markup w/ JSX
  -----------------------------------------------------------------------------

  The markup syntax you've seen above is called JSX. While it may be optional,
  most React projects use JSX for its convenience.

  JSK is stricter than HTML. You have to close tags like <br />. Your component
  also can't return multiple JSX tags. You have to wrap them into a shared parent,
  like a <div>...</div> or an empty <>...</>
*/

function AboutPage()
{
    return
    (
        <>
            <h1>About</h1>
            <p>Hello there.<br />How do you do?</p>
        </>
    );
}

/* Adding Styles
   ----------------------------------------------------------------------------

   In React, you specify a CSS class with 'className'. 
   It works the same way as the HTML 'class' attribute:
*/

<img className="avatar" />

/* Then you write the CSS rules for it in a separate CSS file:

 // in react-app.css
    .avatar { border-radius: 50%; }

    react does not prescribe how you add CSS files. In the simplest case,
    you'll add a '<link>' tag to your HTML. If you use a build tool or a
    framework, consult its documentation to learn how to add a CSS file to
    your project/



    Displaying Data
    ---------------------------------------------------------------------------

    JSX lets you put markup into JavaScript. Curly braces let you “escape back” 
    into JavaScript so that you can embed some variable from your code and 
    display it to the user. For example, this will display 'user.name':
*/

return ( <h1>{user.name}</h1> );

/* You can also "escape into JavaScript" from JSK attributes, but you
   have to use curly braces instead of quotes. For Example,
   'className="avatar" passes the "avatar" string as the CSS class,
   but 'src={user.imageUrl} reads the JavaScript 'user.imageUrl' variable
   value, and then passes that value as the 'src' attribute:
*/

return
(
    <img
        className="avatar"
        src={user.imageUrl}
    />
);